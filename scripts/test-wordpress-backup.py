"""Regression tests for offline WordPress backup integrity validation."""

import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("upload-wordpress-ftps.py")
SPEC = importlib.util.spec_from_file_location("upload_wordpress_ftps", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class WordPressBackupValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / "wordpress"
        self.source.mkdir()
        self.file = self.source / "wp-content" / "index.php"
        self.file.parent.mkdir()
        self.file.write_bytes(b"<?php echo 'verified';")
        content = self.file.read_bytes()
        self.manifest = {
            "host": "example.test",
            "files": [
                {
                    "path": "wp-content/index.php",
                    "size": len(content),
                    "modified": "20260925000000",
                    "sha256": hashlib.sha256(content).hexdigest(),
                }
            ],
            "total_bytes": len(content),
        }

    def tearDown(self):
        self.temp.cleanup()

    def test_accepts_intact_backup(self):
        files = MODULE.validate_manifest(self.manifest, self.source)
        self.assertEqual(files, self.manifest["files"])

    def test_rejects_tampered_file_with_same_size(self):
        self.file.write_bytes(b"<?php echo 'tampered';")
        with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
            MODULE.validate_manifest(self.manifest, self.source)

    def test_rejects_path_traversal(self):
        self.manifest["files"][0]["path"] = "../outside.php"
        with self.assertRaisesRegex(ValueError, "Unsafe manifest path"):
            MODULE.validate_manifest(self.manifest, self.source)

    def test_rejects_noncanonical_or_windows_paths(self):
        for unsafe_path in ("wp-content//index.php", "wp-content\\index.php"):
            with self.subTest(path=unsafe_path):
                self.manifest["files"][0]["path"] = unsafe_path
                with self.assertRaisesRegex(ValueError, "Unsafe manifest path"):
                    MODULE.validate_manifest(self.manifest, self.source)

    def test_rejects_malformed_digest(self):
        self.manifest["files"][0]["sha256"] = "0" * 63
        with self.assertRaisesRegex(ValueError, "Invalid SHA-256"):
            MODULE.validate_manifest(self.manifest, self.source)

    def test_rejects_duplicate_paths(self):
        self.manifest["files"].append(dict(self.manifest["files"][0]))
        self.manifest["total_bytes"] *= 2
        with self.assertRaisesRegex(ValueError, "Duplicate manifest path"):
            MODULE.validate_manifest(self.manifest, self.source)

    def test_rejects_total_byte_mismatch(self):
        self.manifest["total_bytes"] += 1
        with self.assertRaisesRegex(ValueError, "total_bytes mismatch"):
            MODULE.validate_manifest(self.manifest, self.source)

    def test_verify_only_cli_does_not_require_credentials(self):
        manifest_path = self.root / "manifest.json"
        manifest_path.write_text(json.dumps(self.manifest), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--source",
                str(self.source),
                "--manifest",
                str(manifest_path),
                "--verify-only",
            ],
            capture_output=True,
            check=False,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Backup integrity verified: 1 files", result.stdout)


if __name__ == "__main__":
    unittest.main()
