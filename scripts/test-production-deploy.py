"""Regression tests for the non-destructive production FTPS staging gate."""

from datetime import datetime, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("stage-production-ftps.py")
SPEC = importlib.util.spec_from_file_location("stage_production_ftps", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ProductionDeployValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.package = Path(self.temp.name) / "package"
        self.webroot = self.package / "webroot"
        self.file = self.webroot / "de" / "index.html"
        self.file.parent.mkdir(parents=True)
        self.file.write_bytes(b"<!doctype html><title>Verified</title>")
        content = self.file.read_bytes()
        self.manifest = {
            "schema": 1,
            "siteUrl": "https://sonnenblume-mg.com",
            "generatedAt": "2026-09-27T12:00:00.000Z",
            "webroot": {
                "files": 1,
                "bytes": len(content),
                "entries": [
                    {
                        "path": "de/index.html",
                        "bytes": len(content),
                        "sha256": hashlib.sha256(content).hexdigest(),
                    }
                ],
            },
            "serverConfig": [
                {
                    "path": "legacy-redirects.htaccess",
                    "bytes": 1,
                    "sha256": "0" * 64,
                }
            ],
        }
        self.now = datetime(2026, 9, 27, 13, tzinfo=timezone.utc)

    def tearDown(self):
        self.temp.cleanup()

    def validate(self):
        return MODULE.validate_package(self.manifest, self.webroot, now=self.now)

    def test_accepts_complete_fresh_package(self):
        files = self.validate()
        self.assertEqual(files[0]["path"], "de/index.html")

    def test_rejects_tampering_and_unlisted_files(self):
        self.file.write_bytes(b"<!doctype html><title>Tampered</title>")
        with self.assertRaisesRegex(ValueError, "size mismatch|SHA-256 mismatch"):
            self.validate()
        self.file.write_bytes(b"<!doctype html><title>Verified</title>")
        (self.webroot / "unexpected.txt").write_text("unexpected", encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "do not exactly match"):
            self.validate()

    def test_rejects_protected_wordpress_paths(self):
        self.manifest["webroot"]["entries"][0]["path"] = ".htaccess"
        with self.assertRaisesRegex(ValueError, "Protected WordPress path"):
            self.validate()
        self.manifest["webroot"]["entries"][0]["path"] = "wp-admin/index.php"
        with self.assertRaisesRegex(ValueError, "Protected WordPress path"):
            self.validate()

    def test_rejects_wrong_origin_stale_package_and_unsafe_remote_root(self):
        self.manifest["siteUrl"] = "https://staging.sonnenblume-mg.com"
        with self.assertRaisesRegex(ValueError, "expected https://sonnenblume-mg.com"):
            self.validate()
        self.manifest["siteUrl"] = "https://sonnenblume-mg.com"
        self.manifest["generatedAt"] = "2026-09-20T12:00:00.000Z"
        with self.assertRaisesRegex(ValueError, "stale"):
            self.validate()
        with self.assertRaisesRegex(ValueError, "Unsafe remote root"):
            MODULE.normalize_remote_root("/../outside")

    def test_verify_only_cli_needs_no_credentials(self):
        self.manifest["generatedAt"] = datetime.now(timezone.utc).isoformat().replace(
            "+00:00", "Z"
        )
        manifest_path = self.package / "production-upload-manifest.json"
        manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--package",
                str(self.package),
                "--verify-only",
            ],
            capture_output=True,
            check=False,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Production package verified: 1 files", result.stdout)

    def test_apply_cli_requires_separate_production_confirmation(self):
        self.manifest["generatedAt"] = datetime.now(timezone.utc).isoformat().replace(
            "+00:00", "Z"
        )
        manifest_path = self.package / "production-upload-manifest.json"
        manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        environment = dict(os.environ)
        environment.pop("SNB_PRODUCTION_DEPLOY_CONFIRM", None)
        environment.pop("SNB_FTPS_USER", None)
        environment.pop("SNB_FTPS_PASSWORD", None)
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--package",
                str(self.package),
                "--apply",
            ],
            capture_output=True,
            check=False,
            text=True,
            env=environment,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("SNB_PRODUCTION_DEPLOY_CONFIRM", result.stderr)

    def test_remote_hash_is_calculated_from_downloaded_bytes(self):
        class FakeFtp:
            def retrbinary(self, command, callback, blocksize):
                self.command = command
                self.blocksize = blocksize
                callback(b"verified")
                callback(b" remote")

        ftp = FakeFtp()
        digest = MODULE.remote_sha256(ftp, "/de/index.html")
        self.assertEqual(ftp.command, "RETR /de/index.html")
        self.assertEqual(digest, hashlib.sha256(b"verified remote").hexdigest())


if __name__ == "__main__":
    unittest.main()
