import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const bank = JSON.parse(
  await readFile(path.join(root, "src/config/donation-bank.json"), "utf8"),
);
export const qrPath = path.join(root, "public", bank.qrImage);

export function donationPayload() {
  const rearranged = bank.iban.slice(4) + bank.iban.slice(0, 4);
  const digits = rearranged.replace(/[A-Z]/g, (letter) =>
    String(letter.charCodeAt(0) - 55),
  );
  let remainder = 0;
  for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  assert.match(bank.iban, /^DE\d{20}$/);
  assert.equal(remainder, 1, "The donation IBAN checksum is invalid.");
  assert.equal(bank.ibanDisplay.replaceAll(" ", ""), bank.iban);
  assert.match(bank.bic, /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/);
  assert.ok(bank.recipient.length > 0 && bank.recipient.length <= 70);
  assert.ok(bank.reference.length > 0 && bank.reference.length <= 140);
  assert.ok(
    ![bank.recipient, bank.reference].some((value) => /[\r\n]/.test(value)),
  );

  // EPC069-12 v3.1: UTF-8, SCT, no preset amount; only unstructured remittance.
  const payload = [
    "BCD",
    "002",
    "1",
    "SCT",
    bank.bic,
    bank.recipient,
    bank.iban,
    "",
    "",
    "",
    bank.reference,
  ].join("\n");
  assert.ok(Buffer.byteLength(payload, "utf8") <= 331);
  return payload;
}

export async function generateDonationQr() {
  const payload = donationPayload();
  const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
  assert.ok(qr.version <= 13);
  const image = await QRCode.toBuffer(payload, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 4,
    scale: 8,
    color: { dark: "#000000", light: "#ffffff" },
  });
  await mkdir(path.dirname(qrPath), { recursive: true });
  await writeFile(qrPath, image);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await generateDonationQr();
  console.log(
    "Donation EPC QR generated with a complete bank payload and no preset amount.",
  );
}
