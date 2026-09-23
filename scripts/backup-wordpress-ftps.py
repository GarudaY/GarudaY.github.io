"""Download a read-only WordPress webroot over explicit FTPS.

Set SNB_FTPS_USER and SNB_FTPS_PASSWORD in the process environment. The
account should be restricted to the site's directory and have no write access.
Keep the output outside Git and outside any public webroot.
"""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import os
import ssl
import threading
import time
from ftplib import FTP_TLS, all_errors
from pathlib import Path


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


def connect(host):
    ftp = FTP_TLS(context=ssl.create_default_context(), timeout=45)
    ftp.connect(host, 21)
    ftp.login(os.environ["SNB_FTPS_USER"], os.environ["SNB_FTPS_PASSWORD"])
    ftp.prot_p()
    ftp.set_pasv(True)
    return ftp


def inventory(host, workers=8):
    files = []
    directories = ["/"]
    seen = {"/"}
    scanned = 0
    local = threading.local()
    connections = []
    connection_lock = threading.Lock()

    def list_directory(directory):
        ftp = getattr(local, "ftp", None)
        if ftp is None:
            ftp = connect(host)
            local.ftp = ftp
            with connection_lock:
                connections.append(ftp)
        for attempt in range(3):
            try:
                return directory, list(ftp.mlsd(directory))
            except all_errors as error:
                if attempt == 2:
                    raise RuntimeError(f"Failed to list {directory}") from error
                try:
                    ftp.quit()
                except all_errors:
                    pass
                time.sleep(2 * (attempt + 1))
                ftp = connect(host)
                local.ftp = ftp
                with connection_lock:
                    connections.append(ftp)

    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            while directories:
                batch = directories
                directories = []
                futures = [executor.submit(list_directory, directory) for directory in batch]
                for future in as_completed(futures):
                    directory, entries = future.result()
                    for name, facts in entries:
                        if name in (".", ".."):
                            continue
                        if Path(name).name != name or "/" in name or "\\" in name:
                            raise ValueError(f"Unsafe FTP entry name: {name!r}")
                        remote = f"{directory.rstrip('/')}/{name}"
                        kind = facts.get("type")
                        if kind == "dir" and remote not in seen:
                            seen.add(remote)
                            directories.append(remote)
                        elif kind == "file":
                            files.append({
                                "path": remote.lstrip("/"),
                                "size": int(facts["size"]),
                                "modified": facts.get("modify"),
                            })
                        elif kind not in ("dir", "cdir", "pdir"):
                            raise ValueError(f"Unsupported FTP entry type: {remote} ({kind})")
                    scanned += 1
                    if scanned % 100 == 0:
                        print(
                            f"Inventory: {scanned} directories, {len(files)} files, "
                            f"{len(directories)} queued",
                            flush=True,
                        )
    finally:
        for ftp in connections:
            try:
                ftp.quit()
            except Exception:
                pass
    return sorted(files, key=lambda entry: entry["path"])


def download(host, destination, files, workers=8):
    completed = []
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

    def download_one(entry):
        target = local_path(destination / entry["path"])
        target.parent.mkdir(parents=True, exist_ok=True)
        partial = target.with_name(target.name + ".part")
        if target.exists() and target.stat().st_size == entry["size"]:
            digest = sha256_file(target)
            return {**entry, "sha256": digest}, 0

        for attempt in range(3):
            try:
                ftp = get_connection()
                offset = partial.stat().st_size if partial.exists() else 0
                if offset > entry["size"]:
                    partial.unlink()
                    offset = 0
                with partial.open("ab" if offset else "wb") as output:
                    ftp.retrbinary(
                        f"RETR /{entry['path']}",
                        output.write,
                        blocksize=1024 * 256,
                        rest=offset if offset else None,
                    )
                if partial.stat().st_size != entry["size"]:
                    raise IOError(f"Size mismatch for {entry['path']}")
                partial.replace(target)
                digest = sha256_file(target)
                return {**entry, "sha256": digest}, entry["size"] - offset
            except all_errors + (OSError,) as error:
                if attempt == 2:
                    raise RuntimeError(f"Failed to download {entry['path']}") from error
                try:
                    local.ftp.quit()
                except Exception:
                    pass
                local.ftp = None
                time.sleep(2 * (attempt + 1))
        raise RuntimeError(f"Failed to download {entry['path']}")

    try:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = [executor.submit(download_one, entry) for entry in files]
            for index, future in enumerate(as_completed(futures), start=1):
                result, new_bytes = future.result()
                completed.append(result)
                transferred += new_bytes
                if index % 100 == 0 or index == len(files):
                    elapsed = max(time.monotonic() - started, 1)
                    print(
                        f"Downloaded {index}/{len(files)} files, "
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
    return completed


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="w01e41a4.kasserver.com")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--list-only", action="store_true")
    args = parser.parse_args()
    if not os.environ.get("SNB_FTPS_USER") or not os.environ.get("SNB_FTPS_PASSWORD"):
        raise SystemExit("SNB_FTPS_USER and SNB_FTPS_PASSWORD are required")
    if args.output.resolve().is_relative_to(Path.cwd().resolve()):
        raise SystemExit("Backup output must be outside the repository")

    files = inventory(args.host)
    total = sum(entry["size"] for entry in files)
    print(f"Inventory: {len(files)} files, {total / 1024 / 1024:.1f} MiB", flush=True)
    if args.list_only:
        return
    args.output.mkdir(parents=True, exist_ok=True)
    completed = download(args.host, args.output, files)
    completed.sort(key=lambda entry: entry["path"])
    manifest = {
        "host": args.host,
        "files": completed,
        "total_bytes": total,
    }
    (args.output.parent / "wordpress-files-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Backup complete: {len(completed)} files", flush=True)


if __name__ == "__main__":
    main()
