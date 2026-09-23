"""Upload one file atomically to a scoped explicit-FTPS account."""

import argparse
from ftplib import FTP_TLS, error_perm
import os
from pathlib import Path, PurePosixPath
import ssl
import time


def connect(host):
    ftp = FTP_TLS(context=ssl.create_default_context(), timeout=90)
    ftp.connect(host, 21)
    ftp.login(os.environ["SNB_FTPS_USER"], os.environ["SNB_FTPS_PASSWORD"])
    ftp.prot_p()
    ftp.set_pasv(True)
    ftp.voidcmd("TYPE I")
    return ftp


def size_or_none(ftp, path):
    try:
        return ftp.size(path)
    except error_perm as error:
        if str(error).startswith("550"):
            return None
        raise


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("local", type=Path)
    parser.add_argument("remote")
    parser.add_argument("--host", default="w01e41a4.kasserver.com")
    args = parser.parse_args()

    if not os.environ.get("SNB_FTPS_USER") or not os.environ.get("SNB_FTPS_PASSWORD"):
        raise SystemExit("SNB_FTPS_USER and SNB_FTPS_PASSWORD are required")
    if not args.local.is_file():
        raise SystemExit("Local file does not exist")
    remote = str(PurePosixPath("/" + args.remote.lstrip("/")))
    partial = remote + ".snb-upload-part"
    expected = args.local.stat().st_size

    ftp = connect(args.host)
    try:
        if size_or_none(ftp, remote) == expected:
            print(f"Already uploaded: {remote} ({expected} bytes)")
            return
        offset = size_or_none(ftp, partial) or 0
        if offset > expected:
            ftp.delete(partial)
            offset = 0

        started = time.monotonic()
        transferred = offset
        next_report = transferred + 64 * 1024 * 1024

        def progress(chunk):
            nonlocal transferred, next_report
            transferred += len(chunk)
            if transferred >= next_report or transferred == expected:
                elapsed = max(time.monotonic() - started, 1)
                new_bytes = max(transferred - offset, 0)
                print(
                    f"Uploaded {transferred / 1024 / 1024:.1f}/{expected / 1024 / 1024:.1f} MiB "
                    f"({new_bytes / elapsed / 1024 / 1024:.1f} MiB/s)",
                    flush=True,
                )
                next_report = transferred + 64 * 1024 * 1024

        with args.local.open("rb") as source:
            if offset:
                source.seek(offset)
            try:
                ftp.storbinary(
                    f"STOR {partial}",
                    source,
                    blocksize=1024 * 1024,
                    callback=progress,
                    rest=offset if offset else None,
                )
            except error_perm as error:
                if not offset or not (str(error).startswith("500") or str(error).startswith("501")):
                    raise
                ftp.delete(partial)
                offset = 0
                transferred = 0
                with args.local.open("rb") as fresh:
                    ftp.storbinary(
                        f"STOR {partial}",
                        fresh,
                        blocksize=1024 * 1024,
                        callback=progress,
                    )

        if size_or_none(ftp, partial) != expected:
            raise RuntimeError("Remote partial file size does not match local file")
        try:
            ftp.delete(remote)
        except error_perm as error:
            if not str(error).startswith("550"):
                raise
        ftp.rename(partial, remote)
        if size_or_none(ftp, remote) != expected:
            raise RuntimeError("Final remote file size does not match local file")
        print(f"Upload complete: {remote} ({expected} bytes)")
    finally:
        try:
            ftp.quit()
        except Exception:
            pass


if __name__ == "__main__":
    main()
