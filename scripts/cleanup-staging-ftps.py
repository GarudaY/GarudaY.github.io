"""Remove only known temporary staging upload helpers and report leftovers."""

from ftplib import FTP_TLS, error_perm
import os
import ssl


TEMPORARY_FILES = ["/staging-extract.php"]


def main():
    if not os.environ.get("SNB_FTPS_USER") or not os.environ.get("SNB_FTPS_PASSWORD"):
        raise SystemExit("SNB_FTPS_USER and SNB_FTPS_PASSWORD are required")
    ftp = FTP_TLS(context=ssl.create_default_context(), timeout=60)
    ftp.connect(os.environ.get("SNB_FTPS_HOST", "w01e41a4.kasserver.com"), 21)
    ftp.login(os.environ["SNB_FTPS_USER"], os.environ["SNB_FTPS_PASSWORD"])
    ftp.prot_p()
    removed = []
    try:
        for target in TEMPORARY_FILES:
            try:
                ftp.delete(target)
                removed.append(target)
            except error_perm as error:
                if not str(error).startswith("550"):
                    raise
        suspicious = [
            name
            for name in ftp.nlst("/")
            if name.startswith("/staging-")
            or name.endswith((".tar", ".fixed", ".snb-upload-part"))
        ]
        print({"removed": removed, "suspicious": suspicious})
    finally:
        try:
            ftp.quit()
        except Exception:
            pass


if __name__ == "__main__":
    main()
