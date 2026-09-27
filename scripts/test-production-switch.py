"""Regression tests for the production .htaccess switch safety gate."""

import hashlib
import importlib.util
from pathlib import Path
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("switch-production-htaccess.py")
SPEC = importlib.util.spec_from_file_location("switch_production_htaccess", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


ROLLBACK = b"""Options -Indexes
# BEGIN WordPress
RewriteEngine On
RewriteRule . /index.php [L]
# END WordPress
"""
MERGED = b"""Options -Indexes
# BEGIN SONNENBLUME legacy redirects
RewriteEngine On
RewriteRule ^$ /de/ [R=301,L]
# END SONNENBLUME legacy redirects

# BEGIN WordPress
RewriteEngine On
RewriteRule . /index.php [L]
# END WordPress
"""


class FakeFtp:
    def __init__(self, files):
        self.files = dict(files)

    def retrbinary(self, command, callback, blocksize):
        callback(self.files[command.removeprefix("RETR ")])

    def storbinary(self, command, source):
        self.files[command.removeprefix("STOR ")] = source.read()

    def size(self, remote):
        if remote not in self.files:
            raise MODULE.error_perm("550 not found")
        return len(self.files[remote])

    def delete(self, remote):
        if remote not in self.files:
            raise MODULE.error_perm("550 not found")
        del self.files[remote]

    def rename(self, source, destination):
        self.files[destination] = self.files.pop(source)


class ProductionSwitchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.rollback = Path(self.temp.name) / "rollback.htaccess"
        self.merged = Path(self.temp.name) / "merged.htaccess"
        self.rollback.write_bytes(ROLLBACK)
        self.merged.write_bytes(MERGED)

    def tearDown(self):
        self.temp.cleanup()

    def test_accepts_only_a_complete_ordered_pair(self):
        rollback, merged = MODULE.validate_pair(self.rollback, self.merged)
        self.assertEqual(rollback, ROLLBACK)
        self.assertEqual(merged, MERGED)
        self.merged.write_bytes(MERGED.replace(b"# END SONNENBLUME", b"# BROKEN"))
        with self.assertRaisesRegex(ValueError, "complete SONNENBLUME"):
            MODULE.validate_pair(self.rollback, self.merged)

    def test_refuses_any_remote_path_except_root_htaccess(self):
        self.assertEqual(MODULE.normalize_remote("/.htaccess"), "/.htaccess")
        for unsafe in ("/de/.htaccess", "/wp-content/.htaccess", "../.htaccess"):
            with self.subTest(unsafe=unsafe):
                with self.assertRaisesRegex(ValueError, "Only the production root"):
                    MODULE.normalize_remote(unsafe)

    def test_switch_preserves_server_rollback_and_verifies_bytes(self):
        ftp = FakeFtp({"/.htaccess": ROLLBACK})
        old_hash, new_hash, server_rollback = MODULE.replace_remote(
            ftp, "/.htaccess", ROLLBACK, MERGED
        )
        self.assertEqual(ftp.files["/.htaccess"], MERGED)
        self.assertEqual(ftp.files[server_rollback], ROLLBACK)
        self.assertEqual(old_hash, hashlib.sha256(ROLLBACK).hexdigest())
        self.assertEqual(new_hash, hashlib.sha256(MERGED).hexdigest())

    def test_switch_refuses_remote_file_changed_after_backup(self):
        ftp = FakeFtp({"/.htaccess": b"changed"})
        with self.assertRaisesRegex(RuntimeError, "changed after backup"):
            MODULE.replace_remote(ftp, "/.htaccess", ROLLBACK, MERGED)
        self.assertEqual(ftp.files["/.htaccess"], b"changed")

    def test_restore_requires_the_exact_merged_file(self):
        ftp = FakeFtp({"/.htaccess": MERGED})
        MODULE.replace_remote(ftp, "/.htaccess", MERGED, ROLLBACK)
        self.assertEqual(ftp.files["/.htaccess"], ROLLBACK)


if __name__ == "__main__":
    unittest.main()
