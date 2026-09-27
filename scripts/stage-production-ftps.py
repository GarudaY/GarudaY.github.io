"""Stage a verified static production webroot over explicit FTPS.

This uploader never deletes unrelated remote files and refuses every protected
WordPress root path. It does not upload .htaccess, so switching traffic remains
a separate reviewed operation after the staged files have been verified.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from ftplib import FTP_TLS, all_errors, error_perm
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import ssl
import threading
import time


EXPECTED_SITE = "https://sonnenblume-mg.com"
EXPECTED_CONFIRMATION = "sonnenblume-mg.com"
PROTECTED_ROOT_PATHS = {
    ".htaccess",
    ".htpasswd",
    "index.php",
    "wp-admin",
    "wp-content",
    "wp-includes",
    "wp-json",
    "wp-config.php",
    "wp-load.php",
    "wp-login.php",
}
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


def normalize_relative(value):
    if not isinstance(value, str) or not value:
        raise ValueError("Manifest path must be a non-empty string")
    normalized = PurePosixPath(value)
    if (
        normalized.is_absolute()
        or "\\" in value
        or value != str(normalized)
        or any(part in ("", ".", "..") for part in normalized.parts)
    ):
        raise ValueError(f"Unsafe manifest path: {value!r}")
    if normalized.parts[0].lower() in PROTECTED_ROOT_PATHS:
        raise ValueError(f"Protected WordPress path in upload package: {value}")
    return normalized


def parse_generated_at(value):
    if not isinstance(value, str):
        raise ValueError("Manifest generatedAt must be a string")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("Invalid manifest generatedAt") from error
    if parsed.tzinfo is None:
        raise ValueError("Manifest generatedAt must include a timezone")
    return parsed.astimezone(timezone.utc)


def list_source_files(source):
    files = []
    for directory, directory_names, file_names in os.walk(source, followlinks=False):
        directory_path = Path(directory)
        for name in directory_names:
            if (directory_path / name).is_symlink():
                raise ValueError(f"Upload source contains a directory symlink: {name}")
        for name in file_names:
            candidate = directory_path / name
            if candidate.is_symlink():
                raise ValueError(f"Upload source contains a file symlink: {name}")
            files.append(candidate.relative_to(source).as_posix())
    return sorted(files)


def validate_package(
    manifest,
    source,
    *,
    now=None,
    max_age_hours=24,
    progress=None,
):
    """Validate every webroot byte before a network connection can be opened."""
    if not isinstance(manifest, dict) or manifest.get("schema") != 1:
        raise ValueError("Unsupported production manifest schema")
    if manifest.get("siteUrl") != EXPECTED_SITE:
        raise ValueError(
            f"Production package targets {manifest.get('siteUrl')!r}, expected {EXPECTED_SITE}"
        )
    generated_at = parse_generated_at(manifest.get("generatedAt"))
    current = now or datetime.now(timezone.utc)
    if current.tzinfo is None:
        current = current.replace(tzinfo=timezone.utc)
    age_hours = (current.astimezone(timezone.utc) - generated_at).total_seconds() / 3600
    if age_hours < -0.25:
        raise ValueError("Production package is dated in the future")
    if age_hours > max_age_hours:
        raise ValueError(
            f"Production package is stale ({age_hours:.1f} hours; limit {max_age_hours})"
        )

    webroot = manifest.get("webroot")
    if not isinstance(webroot, dict) or not isinstance(webroot.get("entries"), list):
        raise ValueError("Production webroot manifest is missing")
    entries = webroot["entries"]
    if not entries:
        raise ValueError("Production webroot manifest has no files")

    source_root = source.resolve()
    seen = set()
    validated = []
    total = 0
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise ValueError(f"Manifest entry {index} must be an object")
        normalized = normalize_relative(entry.get("path"))
        relative = str(normalized)
        if relative in seen:
            raise ValueError(f"Duplicate webroot path: {relative}")
        seen.add(relative)
        size = entry.get("bytes")
        digest = entry.get("sha256")
        if isinstance(size, bool) or not isinstance(size, int) or size < 0:
            raise ValueError(f"Invalid byte count for {relative}")
        if not isinstance(digest, str) or not SHA256_PATTERN.fullmatch(digest):
            raise ValueError(f"Invalid SHA-256 for {relative}")

        candidate = (source_root / Path(*normalized.parts)).resolve()
        try:
            candidate.relative_to(source_root)
        except ValueError as error:
            raise ValueError(f"Manifest path escapes source root: {relative}") from error
        source_file = local_path(candidate)
        if not source_file.is_file() or source_file.stat().st_size != size:
            raise ValueError(f"Production file size mismatch: {relative}")
        if sha256_file(source_file) != digest:
            raise ValueError(f"Production SHA-256 mismatch: {relative}")
        validated.append({"path": relative, "bytes": size, "sha256": digest})
        total += size
        if progress and ((index + 1) % 100 == 0 or index + 1 == len(entries)):
            progress(index + 1, len(entries), total)

    actual = list_source_files(source_root)
    if actual != sorted(seen):
        raise ValueError("Webroot contents do not exactly match the production manifest")
    if webroot.get("files") != len(validated) or webroot.get("bytes") != total:
        raise ValueError("Production manifest totals do not match its entries")
    return validated


def connect(host):
    ftp = FTP_TLS(context=ssl.create_default_context(), timeout=60)
    ftp.connect(host, 21)
    ftp.login(os.environ["SNB_FTPS_USER"], os.environ["SNB_FTPS_PASSWORD"])
    ftp.prot_p()
    ftp.set_pasv(True)
    ftp.voidcmd("TYPE I")
    return ftp


def normalize_remote_root(value):
    root = PurePosixPath("/" + value.strip("/"))
    if any(part in (".", "..") for part in root.parts):
        raise ValueError("Unsafe remote root")
    return root


def remote_path(remote_root, relative):
    normalized = normalize_relative(relative)
    return str(remote_root.joinpath(*normalized.parts))


def remote_size(ftp, remote):
    try:
        return ftp.size(remote)
    except error_perm as error:
        if str(error).startswith("550"):
            return None
        raise


def remote_sha256(ftp, remote):
    digest = hashlib.sha256()
    ftp.retrbinary(f"RETR {remote}", digest.update, blocksize=1024 * 256)
    return digest.hexdigest()


def ensure_directories(host, remote_root, files):
    directories = {
        str(parent)
        for entry in files
        for parent in PurePosixPath(remote_path(remote_root, entry["path"])).parents
        if str(parent) not in ("/", ".")
    }
    ftp = connect(host)
    try:
        for directory in sorted(directories, key=lambda item: (item.count("/"), item)):
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


def upload(host, source, remote_root, files, workers=6):
    completed = 0
    transferred = 0
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
        source_file = local_path(source / Path(*PurePosixPath(entry["path"]).parts))
        expected = entry["bytes"]
        if source_file.stat().st_size != expected or sha256_file(source_file) != entry["sha256"]:
            raise RuntimeError(f"Local source changed after validation: {entry['path']}")
        remote = remote_path(remote_root, entry["path"])
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
                        if offset and str(error).startswith(("500", "501")):
                            try:
                                ftp.delete(partial)
                            except error_perm:
                                pass
                            with source_file.open("rb") as fresh:
                                ftp.storbinary(
                                    f"STOR {partial}", fresh, blocksize=1024 * 256
                                )
                        else:
                            raise
                if remote_size(ftp, partial) != expected:
                    raise IOError(f"Remote partial size mismatch: {entry['path']}")
                try:
                    ftp.delete(remote)
                except error_perm as error:
                    if not str(error).startswith("550"):
                        raise
                ftp.rename(partial, remote)
                if remote_size(ftp, remote) != expected:
                    raise IOError(f"Final remote size mismatch: {entry['path']}")
                if remote_sha256(ftp, remote) != entry["sha256"]:
                    raise IOError(f"Final remote SHA-256 mismatch: {entry['path']}")
                return expected
            except all_errors + (OSError,) as error:
                reset_connection()
                if attempt == 3:
                    raise RuntimeError(f"Failed to upload {entry['path']}") from error
                time.sleep(2 * (attempt + 1))
        raise RuntimeError(f"Failed to upload {entry['path']}")

    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(upload_one, entry) for entry in files]
            for future in as_completed(futures):
                transferred += future.result()
                completed += 1
                if completed % 100 == 0 or completed == len(files):
                    elapsed = max(time.monotonic() - started, 1)
                    print(
                        f"Staged {completed}/{len(files)} files, "
                        f"{transferred / 1024 / 1024:.1f} MiB, "
                        f"{transferred / elapsed / 1024 / 1024:.1f} MiB/s",
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
    parser.add_argument("--package", type=Path, required=True)
    parser.add_argument("--host", default="w01e41a4.kasserver.com")
    parser.add_argument("--remote-root", default="/")
    parser.add_argument("--workers", type=int, default=6)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--verify-only", action="store_true")
    mode.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if not 1 <= args.workers <= 8:
        raise SystemExit("workers must be between 1 and 8")
    package = args.package.resolve()
    source = package / "webroot"
    manifest_path = package / "production-upload-manifest.json"
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        files = validate_package(
            manifest,
            source,
            progress=lambda checked, count, size: print(
                f"Verified {checked}/{count} production files "
                f"({size / 1024 / 1024:.1f} MiB)",
                flush=True,
            ),
        )
        remote_root = normalize_remote_root(args.remote_root)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        raise SystemExit(f"Production package verification failed: {error}") from error

    print(
        f"Production package verified: {len(files)} files, "
        f"{sum(entry['bytes'] for entry in files) / 1024 / 1024:.1f} MiB",
        flush=True,
    )
    if args.verify_only:
        return
    if os.environ.get("SNB_PRODUCTION_DEPLOY_CONFIRM") != EXPECTED_CONFIRMATION:
        raise SystemExit(
            f"SNB_PRODUCTION_DEPLOY_CONFIRM must equal {EXPECTED_CONFIRMATION}"
        )
    if not os.environ.get("SNB_FTPS_USER") or not os.environ.get("SNB_FTPS_PASSWORD"):
        raise SystemExit("SNB_FTPS_USER and SNB_FTPS_PASSWORD are required")
    ensure_directories(args.host, remote_root, files)
    upload(args.host, source, remote_root, files, workers=args.workers)
    print(
        "Static production files staged and re-downloaded for SHA-256 verification. "
        ".htaccess was not changed; traffic was not switched.",
        flush=True,
    )


if __name__ == "__main__":
    main()
