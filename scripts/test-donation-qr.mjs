import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import { bank, donationPayload, qrPath } from "./donation-qr.mjs";

test("the actual public donation PNG contains complete EPC payment data", async () => {
  const image = PNG.sync.read(await readFile(qrPath));
  const decoded = jsQR(
    new Uint8ClampedArray(image.data),
    image.width,
    image.height,
    { inversionAttempts: "dontInvert" },
  );
  assert.ok(decoded, "The public QR image cannot be decoded.");
  assert.equal(decoded.data, donationPayload());
  const fields = decoded.data.split("\n");
  assert.deepEqual(fields.slice(0, 4), ["BCD", "002", "1", "SCT"]);
  assert.equal(fields[5], "Sonnenblume e.V.");
  assert.equal(fields[6], "DE83310500001004209837");
  assert.equal(fields[7], "", "A donation amount must never be preset.");
  assert.equal(
    fields[9],
    "",
    "Do not combine structured and unstructured remittance.",
  );
  assert.equal(fields[10], bank.reference);
  assert.ok(decoded.version <= 13);
});

test("the QR remains readable at its 224px mobile display size", async () => {
  const source = PNG.sync.read(await readFile(qrPath));
  const width = 224;
  const data = new Uint8ClampedArray(width * width * 4);
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      const sourceIndex =
        (Math.floor((y * source.height) / width) * source.width +
          Math.floor((x * source.width) / width)) *
        4;
      data.set(
        source.data.subarray(sourceIndex, sourceIndex + 4),
        (y * width + x) * 4,
      );
    }
  }
  assert.equal(jsQR(data, width, width)?.data, donationPayload());
});
