"""Upload a validated WordPress backup to an isolated FTPS webroot.

Set SNB_FTPS_USER and SNB_FTPS_PASSWORD in the process environment. The FTP
account must be restricted to the staging directory. The root .htaccess,
.htpasswd, and wp-config.php are intentionally excluded so hosting protection
and production database credentials are never overwritten into staging.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import os
import re
import ssl
import threading
import time
from ftplib import FTP_TLS, all_errors, error_perm
from pathlib import Path, PurePosixPath


EXCLUDED_ROOT_FILES = {".htaccess", ".htpasswd", "wp-config.php"}
SHA256_PATTERN = re.compile(r"[0-9a-f]{64}")


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def local_path(path):
    resolved = path.resolve()
    if os.name == "nt" and not str(resolved).startswith("\\\\?\\"):
        return Path("\\\\?\\" + str(resolved))
    return resolved


def validate_manifest(manifest, source, progress=None):
    """Validate every manifest entry and local file before any network write."""
    if not isinstance(manifest, dict):
        raise ValueError("Manifest root must be an object")
    if not isinstance(manifest.get("host"), str) or not manifest["host"].strip():
        raise ValueError("Manifest host must be a non-empty string")
    if not isinstance(manifest.get("files"), list) or not manifest["files"]:
        raise ValueError("Manifest files must be a non-empty array")

    source_root = source.resolve()
    seen = set()
    validated = []
    calculated_total = 0

    for index, entry in enumerate(manifest["files"]):
        label = f"Manifest entry {index}"
        if not isinstance(entry, dict):
            raise ValueError(f"{label} must be an object")

        path = entry.get("path")
        if not isinstance(path, str) or not path:
            raise ValueError(f"{label} path must be a non-empty string")
        normalized = PurePosixPath(path)
        if (
            normalized.is_absolute()
            or "\\" in path
            or path != str(normalized)
            or any(part in ("", ".", "..") for part in normalized.parts)
        ):
            raise ValueError(f"Unsafe manifest path: {path!r}")
        if path in seen:
            raise ValueError(f"Duplicate manifest path: {path}")
        seen.add(path)

        size = entry.get("size")
        if isinstance(size, bool) or not isinstance(size, int) or size < 0:
            raise ValueError(f"Invalid size for {path}")
        expected_digest = entry.get("sha256")
        if not isinstance(expected_digest, str) or not SHA256_PATTERN.fullmatch(expected_digest):
            raise ValueError(f"Invalid SHA-256 for {path}")

        candidate = source_root.joinpath(*normalized.parts).resolve()
        try:
            candidate.relative_to(source_root)
        except ValueError as error:
            raise ValueError(f"Manifest path escapes source root: {path}") from error
        source_file = local_path(candidate)
        if not source_file.is_file():
            raise ValueError(f"Backup file is missing: {path}")
        if source_file.stat().st_size != size:
            raise ValueError(f"Backup size mismatch: {path}")
        if sha256_file(source_file) != expected_digest:
            raise ValueError(f"Backup SHA-256 mismatch: {path}")

        calculated_total += size
        validated.append(entry)
        if progress and ((index + 1) % 500 == 0 or index + 1 == len(manifest["files"])):
            progress(index + 1, len(manifest["files"]), calculated_total)

    total_bytes = manifest.get("total_bytes")
    if isinstance(total_bytes, bool) or not isinstance(total_bytes, int):
        raise ValueError("Manifest total_bytes must be an integer")
    if total_bytes != calculated_total:
        raise ValueError(
            f"Manifest total_bytes mismatch: expected {total_bytes}, calculated {calculated_total}"
        )
    return validated


def connect(host):
    ftp = FTP_TLS(context=ssl.create_default_context(), timeout=60)
    ftp.connect(host, 21)
    ftp.login(os.environ["SNB_FTPS_USER"], os.environ["SNB_FTPS_PASSWORD"])
    ftp.prot_p()
    ftp.set_pasv(True)
    ftp.voidcmd("TYPE I")
    return ftp


def remote_size(ftp, remote):
    try:
        return ftp.size(remote)
    except error_perm as error:
        if str(error).startswith("550"):
            return None
        raise


def ensure_directories(host, files):
    directories = {
        str(parent)
        for entry in files
        for parent in PurePosixPath("/" + entry["path"]).parents
        if str(parent) not in ("/", ".")
    }
    ftp = connect(host)
    try:
        for directory in sorted(directories, key=lambda value: (value.count("/"), value)):
            try:
                ftp.mkd(directory)
            except error_perm as error:
                if not str(error).startswith("550"):
                    raise
    finally:
        try:
            ftp.quit()
        except Exception:
            pass


def upload(host, source, files, workers=8):
    uploaded_bytes = 0
    skipped_bytes = 0
    completed = 0
    started = time.monotonic()
    local = threading.local()
    connections = []
    connection_lock = threading.Lock()

    def get_connection():
        ftp = getattr(local, "ftp", None)
        if ftp is None:
            ftp = connect(host)
            local.ftp = ftp
            with connection_lock:
                connections.append(ftp)
        return ftp

    def reset_connection():
        try:
            local.ftp.quit()
        except Exception:
            pass
        local.ftp = None

    def upload_one(entry):
        path = entry["path"]
        source_file = local_path(source / path)
        expected = int(entry["size"])
        if not source_file.is_file() or source_file.stat().st_size != expected:
            raise RuntimeError(f"Local source validation failed for {path}")
        if sha256_file(source_file) != entry["sha256"]:
            raise RuntimeError(f"Local source changed after validation for {path}")

        remote = "/" + path.replace("\\", "/")
        # The digest-scoped name makes an interrupted upload resumable only for
        # this exact file content. An existing destination is never trusted by
        # size alone; a restore always replaces it with the verified backup.
        partial = remote + f".{entry['sha256'][:16]}.snb-upload-part"
        for attempt in range(4):
            try:
                ftp = get_connection()
                offset = remote_size(ftp, partial) or 0
                if offset > expected:
                    ftp.delete(partial)
                    offset = 0

                with source_file.open("rb") as handle:
                    if offset:
                        handle.seek(offset)
                    try:
                        ftp.storbinary(
                            f"STOR {partial}",
                            handle,
                            blocksize=1024 * 256,
                            rest=offset if offset else None,
                        )
                    except error_perm as error:
                        if offset and (str(error).startswith("500") or str(error).startswith("501")):
                            try:
                                ftp.delete(partial)
                            except error_perm:
                                pass
                            with source_file.open("rb") as fresh:
                                ftp.storbinary(f"STOR {partial}", fresh, blocksize=1024 * 256)
                        else:
                            raise

                if remote_size(ftp, partial) != expected:
                    raise IOError(f"Remote size mismatch for {path}")
                try:
                    ftp.delete(remote)
                except error_perm as error:
                    if not str(error).startswith("550"):
                        raise
                ftp.rename(partial, remote)
                if remote_size(ftp, remote) != expected:
                    raise IOError(f"Final remote size mismatch for {path}")
                return expected - offset, 0
            except all_errors + (OSError,) as error:
                reset_connection()
                if attempt == 3:
                    raise RuntimeError(f"Failed to upload {path}") from error
                time.sleep(2 * (attempt + 1))
        raise RuntimeError(f"Failed to upload {path}")

    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(upload_one, entry) for entry in files]
            for future in as_completed(futures):
                new_bytes, existing_bytes = future.result()
                uploaded_bytes += new_bytes
                skipped_bytes += existing_bytes
                completed += 1
                if completed % 100 == 0 or completed == len(files):
                    elapsed = max(time.monotonic() - started, 1)
                    print(
                        f"Uploaded {completed}/{len(files)} files, "
                        f"{uploaded_bytes / 1024 / 1024:.1f} MiB new, "
                        f"{skipped_bytes / 1024 / 1024:.1f} MiB resumed, "
                        f"{uploaded_bytes / elapsed / 1024 / 1024:.1f} MiB/s",
                        flush=True,
                    )
    finally:
        for ftp in connections:
            try:
                ftp.quit()
            except Exception:
                pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="w01e41a4.kasserver.com")
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--workers", type=int, default=8)
    parser.add_argument(
        "--verify-only",
        action="store_true",
        help="Verify manifest, sizes, and SHA-256 hashes without connecting to FTPS",
    )
    args = parser.parse_args()

    if not 1 <= args.workers <= 8:
        raise SystemExit("workers must be between 1 and 8")

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    try:
        manifest_files = validate_manifest(
            manifest,
            args.source,
            progress=lambda checked, count, size: print(
                f"Verified {checked}/{count} files ({size / 1024 / 1024:.1f} MiB)",
                flush=True,
            ),
        )
    except ValueError as error:
        raise SystemExit(f"Backup integrity verification failed: {error}") from error

    print(
        f"Backup integrity verified: {len(manifest_files)} files, "
        f"{manifest['total_bytes'] / 1024 / 1024:.1f} MiB",
        flush=True,
    )
    if args.verify_only:
        return

    if not os.environ.get("SNB_FTPS_USER") or not os.environ.get("SNB_FTPS_PASSWORD"):
        raise SystemExit("SNB_FTPS_USER and SNB_FTPS_PASSWORD are required")

    files = [
        entry
        for entry in manifest_files
        if entry["path"] not in EXCLUDED_ROOT_FILES
    ]
    if len(files) + len(
        {entry["path"] for entry in manifest_files if entry["path"] in EXCLUDED_ROOT_FILES}
    ) != len(manifest_files):
        raise SystemExit("Manifest filtering was not exhaustive")

    total = sum(int(entry["size"]) for entry in files)
    print(
        f"Preparing {len(files)} files ({total / 1024 / 1024:.1f} MiB); "
        f"excluded root files: {', '.join(sorted(EXCLUDED_ROOT_FILES))}",
        flush=True,
    )
    ensure_directories(args.host, files)
    upload(args.host, args.source, files, workers=args.workers)
    print("Staging file upload verified by remote file size", flush=True)


if __name__ == "__main__":
    main()
