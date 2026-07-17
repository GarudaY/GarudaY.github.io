import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const dataDirectory = path.resolve(
  process.env.LOCAL_DATA_DIR?.trim() || path.join(process.cwd(), ".data"),
);
const dataFile = path.join(dataDirectory, "operations.json");

let backup = null;
try {
  backup = await readFile(dataFile, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function jsonRequest(pathname, init) {
  const response = await fetch(`${baseUrl}${pathname}`, init);
  const body = await response.json();
  return { response, body };
}

await mkdir(dataDirectory, { recursive: true });
await writeFile(
  dataFile,
  `${JSON.stringify({ version: 1, registrations: [], contacts: [] }, null, 2)}\n`,
  "utf8",
);

try {
  const suffix = Date.now();
  const registrationPayload = {
    locale: "uk",
    eventSlug: "blagodiyna-maysternya",
    name: "Smoke Test",
    email: `confirmed-${suffix}@example.invalid`,
    participants: 1,
    group: "adults",
    note: "Automated local smoke test",
    consent: true,
    company: "",
  };

  const first = await jsonRequest("/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registrationPayload),
  });
  assert(first.response.status === 201, "First registration was not created.");
  assert(first.body.status === "confirmed", "First registration was not confirmed.");

  const duplicate = await jsonRequest("/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registrationPayload),
  });
  assert(duplicate.response.status === 409, "Duplicate registration was not blocked.");

  const waitlist = await jsonRequest("/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...registrationPayload,
      email: `waitlist-${suffix}@example.invalid`,
      participants: 2,
    }),
  });
  assert(waitlist.response.status === 201, "Waitlist registration was not created.");
  assert(waitlist.body.status === "waitlist", "Overflow was not placed on waitlist.");

  const firstToken = first.body.cancellationPath.split("/").at(-1);
  const cancelled = await jsonRequest(`/api/registrations/${firstToken}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert(cancelled.response.ok, "Confirmed registration could not be cancelled.");

  const waitlistToken = waitlist.body.cancellationPath.split("/").at(-1);
  const promoted = await jsonRequest(`/api/registrations/${waitlistToken}`);
  assert(promoted.response.ok, "Promoted registration could not be read.");
  assert(promoted.body.status === "confirmed", "Waitlist was not promoted after cancellation.");

  const contact = await jsonRequest("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      locale: "uk",
      name: "Smoke Test",
      email: `contact-${suffix}@example.invalid`,
      topic: "events",
      message: "Automated contact queue smoke test.",
      consent: true,
      company: "",
    }),
  });
  assert(contact.response.status === 201, "Contact request was not stored.");

  const admin = await jsonRequest("/api/admin/operations");
  assert(admin.response.ok, "Local admin API is unavailable.");
  assert(
    admin.body.registrations.some((item) => item.reference === waitlist.body.reference),
    "Registration is missing from admin API.",
  );
  assert(
    admin.body.contacts.some((item) => item.reference === contact.body.reference),
    "Contact request is missing from admin API.",
  );

  const csv = await fetch(`${baseUrl}/api/admin/export?kind=registrations`);
  const csvText = await csv.text();
  assert(csv.ok && csvText.includes(waitlist.body.reference), "CSV export is invalid.");

  console.log("Operations smoke test passed: registration, duplicate, waitlist, promotion, contact, admin and CSV.");
} finally {
  if (backup === null) {
    await rm(dataFile, { force: true });
  } else {
    await writeFile(dataFile, backup, "utf8");
  }
}
