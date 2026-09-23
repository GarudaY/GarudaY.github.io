"""Upload a validated WordPress backup to an isolated FTPS webroot.

Set SNB_FTPS_USER and SNB_FTPS_PASSWORD in the process environment. The FTP
account must be restricted to the staging directory. The root .htaccess,
.htpasswd, and wp-config.php are intentionally excluded so hosting protection
and production database credentials are never overwritten into staging.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
import ssl
import threading
import time
from ftplib import FTP_TLS, all_errors, error_perm
from pathlib import Path, PurePosixPath


EXCLUDED_ROOT_FILES = {".htaccess", ".htpasswd", "wp-config.php"}


def local_path(path):
    resolved = path.resolve()
    if os.name == "nt" and not str(resolved).startswith("\\\\?\\"):
        return Path("\\\\?\\" + str(resolved))
    return resolved


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

        remote = "/" + path.replace("\\", "/")
        partial = remote + ".snb-upload-part"
        for attempt in range(4):
            try:
                ftp = get_connection()
                if remote_size(ftp, remote) == expected:
                    return 0, expected

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
    args = parser.parse_args()

    if not os.environ.get("SNB_FTPS_USER") or not os.environ.get("SNB_FTPS_PASSWORD"):
        raise SystemExit("SNB_FTPS_USER and SNB_FTPS_PASSWORD are required")
    if not 1 <= args.workers <= 8:
        raise SystemExit("workers must be between 1 and 8")

    manifest = json.loads(args.manifest.read_text(encoding="utf-8"))
    files = [
        entry
        for entry in manifest["files"]
        if entry["path"] not in EXCLUDED_ROOT_FILES
    ]
    if len(files) + len(
        {entry["path"] for entry in manifest["files"] if entry["path"] in EXCLUDED_ROOT_FILES}
    ) != len(manifest["files"]):
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
