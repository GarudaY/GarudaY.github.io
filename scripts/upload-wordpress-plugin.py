"""Atomically upload the SONNENBLUME plugin through a staging-scoped FTPS account."""

from ftplib import FTP_TLS, error_perm
import os
from pathlib import Path, PurePosixPath
import ssl


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "cms" / "wordpress" / "sonnenblume-content"
DESTINATION = PurePosixPath("/wp-content/plugins/sonnenblume-content")


def connect():
    ftp = FTP_TLS(context=ssl.create_default_context(), timeout=90)
    ftp.connect(os.environ.get("SNB_FTPS_HOST", "w01e41a4.kasserver.com"), 21)
    ftp.login(os.environ["SNB_FTPS_USER"], os.environ["SNB_FTPS_PASSWORD"])
    ftp.prot_p()
    ftp.set_pasv(True)
    ftp.voidcmd("TYPE I")
    return ftp


def ensure_directory(ftp, directory):
    current = PurePosixPath("/")
    for part in PurePosixPath(directory).parts[1:]:
        current /= part
        try:
            ftp.mkd(str(current))
        except error_perm as error:
            if not str(error).startswith("550"):
                raise


def main():
    if not SOURCE.is_dir():
        raise SystemExit("Plugin source directory is missing")
    if not os.environ.get("SNB_FTPS_USER") or not os.environ.get("SNB_FTPS_PASSWORD"):
        raise SystemExit("SNB_FTPS_USER and SNB_FTPS_PASSWORD are required")

    files = sorted(path for path in SOURCE.rglob("*") if path.is_file())
    ftp = connect()
    try:
        ensure_directory(ftp, DESTINATION)
        for source in files:
            relative = source.relative_to(SOURCE).as_posix()
            remote = DESTINATION / relative
            ensure_directory(ftp, remote.parent)
            partial = str(remote) + ".snb-upload-part"
            with source.open("rb") as handle:
                ftp.storbinary(f"STOR {partial}", handle, blocksize=256 * 1024)
            try:
                ftp.delete(str(remote))
            except error_perm as error:
                if not str(error).startswith("550"):
                    raise
            ftp.rename(partial, str(remote))
            if ftp.size(str(remote)) != source.stat().st_size:
                raise RuntimeError(f"Remote size mismatch: {relative}")
        print(f"Uploaded and verified {len(files)} plugin files")
    finally:
        try:
            ftp.quit()
        except Exception:
            pass


if __name__ == "__main__":
    main()
