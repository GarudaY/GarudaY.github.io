"""Atomically switch or restore the production .htaccess over explicit FTPS."""

import argparse
from ftplib import FTP_TLS, error_perm
import hashlib
from io import BytesIO
import os
from pathlib import Path, PurePosixPath
import ssl


EXPECTED_CONFIRMATION = "sonnenblume-mg.com"
MAX_HTACCESS_BYTES = 1024 * 1024


def sha256_bytes(content):
    return hashlib.sha256(content).hexdigest()


def read_local(path):
    content = path.read_bytes()
    if not content or len(content) > MAX_HTACCESS_BYTES:
        raise ValueError(f"Invalid .htaccess size: {path}")
    return content


def validate_pair(rollback, merged):
    rollback_bytes = read_local(rollback)
    merged_bytes = read_local(merged)
    for marker in (b"# BEGIN WordPress", b"# END WordPress"):
        if rollback_bytes.count(marker) != 1 or merged_bytes.count(marker) != 1:
            raise ValueError(f"Expected exactly one {marker.decode()} marker")
    begin = b"# BEGIN SONNENBLUME legacy redirects"
    end = b"# END SONNENBLUME legacy redirects"
    if merged_bytes.count(begin) != 1 or merged_bytes.count(end) != 1:
        raise ValueError("Merged .htaccess has no complete SONNENBLUME block")
    if merged_bytes.index(begin) > merged_bytes.index(b"# BEGIN WordPress"):
        raise ValueError("SONNENBLUME block must be before WordPress rules")
    if rollback_bytes == merged_bytes:
        raise ValueError("Merged and rollback .htaccess files are identical")
    return rollback_bytes, merged_bytes


def normalize_remote(value):
    normalized = PurePosixPath("/" + value.lstrip("/"))
    if str(normalized) != "/.htaccess":
        raise ValueError("Only the production root /.htaccess may be switched")
    return str(normalized)


def connect(host):
    ftp = FTP_TLS(context=ssl.create_default_context(), timeout=60)
    ftp.connect(host, 21)
    ftp.login(os.environ["SNB_FTPS_USER"], os.environ["SNB_FTPS_PASSWORD"])
    ftp.prot_p()
    ftp.set_pasv(True)
    ftp.voidcmd("TYPE I")
    return ftp


def remote_bytes(ftp, remote):
    chunks = []
    total = 0

    def receive(chunk):
        nonlocal total
        total += len(chunk)
        if total > MAX_HTACCESS_BYTES:
            raise ValueError("Remote .htaccess exceeds the safety limit")
        chunks.append(chunk)

    ftp.retrbinary(f"RETR {remote}", receive, blocksize=64 * 1024)
    return b"".join(chunks)


def size_or_none(ftp, remote):
    try:
        return ftp.size(remote)
    except error_perm as error:
        if str(error).startswith("550"):
            return None
        raise


def delete_if_present(ftp, remote):
    try:
        ftp.delete(remote)
    except error_perm as error:
        if not str(error).startswith("550"):
            raise


def replace_remote(ftp, remote, expected_current, replacement):
    current = remote_bytes(ftp, remote)
    expected_hash = sha256_bytes(expected_current)
    if sha256_bytes(current) != expected_hash:
        raise RuntimeError(
            "Remote .htaccess changed after backup; refusing to overwrite it"
        )

    replacement_hash = sha256_bytes(replacement)
    partial = f"{remote}.{replacement_hash[:16]}.snb-switch-part"
    server_rollback = f"{remote}.{expected_hash[:16]}.snb-rollback"
    delete_if_present(ftp, partial)
    ftp.storbinary(f"STOR {partial}", BytesIO(replacement))
    if remote_bytes(ftp, partial) != replacement:
        raise RuntimeError("Remote switch partial failed byte verification")

    existing_rollback_size = size_or_none(ftp, server_rollback)
    if existing_rollback_size is not None:
        if remote_bytes(ftp, server_rollback) != expected_current:
            raise RuntimeError("Existing server rollback file has unexpected content")
        delete_if_present(ftp, remote)
    else:
        ftp.rename(remote, server_rollback)

    try:
        ftp.rename(partial, remote)
        if remote_bytes(ftp, remote) != replacement:
            raise RuntimeError("Final remote .htaccess failed byte verification")
    except Exception:
        delete_if_present(ftp, remote)
        if size_or_none(ftp, server_rollback) is not None:
            ftp.rename(server_rollback, remote)
        raise
    return expected_hash, replacement_hash, server_rollback


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rollback", type=Path, required=True)
    parser.add_argument("--merged", type=Path, required=True)
    parser.add_argument("--host", default="w01e41a4.kasserver.com")
    parser.add_argument("--remote", default="/.htaccess")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--verify-only", action="store_true")
    mode.add_argument("--apply", action="store_true")
    mode.add_argument("--restore", action="store_true")
    args = parser.parse_args()

    try:
        rollback, merged = validate_pair(args.rollback, args.merged)
        remote = normalize_remote(args.remote)
    except (OSError, ValueError) as error:
        raise SystemExit(f".htaccess switch validation failed: {error}") from error
    print(
        f".htaccess pair verified: rollback {sha256_bytes(rollback)}, "
        f"merged {sha256_bytes(merged)}",
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

    ftp = connect(args.host)
    try:
        expected, replacement = (merged, rollback) if args.restore else (rollback, merged)
        old_hash, new_hash, server_rollback = replace_remote(
            ftp, remote, expected, replacement
        )
        action = "restored" if args.restore else "switched"
        print(
            f"Production .htaccess {action}: {old_hash} -> {new_hash}; "
            f"server rollback copy: {server_rollback}",
            flush=True,
        )
    finally:
        try:
            ftp.quit()
        except Exception:
            pass


if __name__ == "__main__":
    main()
