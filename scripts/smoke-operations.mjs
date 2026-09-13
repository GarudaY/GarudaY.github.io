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
  const closedRegistrationPayload = {
    locale: "uk",
    eventSlug: "mizhnarodnyi-den-zakhystu-ditei-2025",
    name: "Smoke Test",
    email: `confirmed-${suffix}@example.invalid`,
    participants: 1,
    group: "adults",
    note: "Automated local smoke test",
    consent: true,
    company: "",
  };

  const closedRegistration = await jsonRequest("/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(closedRegistrationPayload),
  });
  assert(
    closedRegistration.response.status === 404 &&
      closedRegistration.body.code === "event_unavailable",
    "A past event unexpectedly accepted a registration.",
  );

  const contactCases = [
    ["general", "kontakt@sonnenblume-mg.com"],
    ["courses", "kurse@sonnenblume-mg.com"],
    ["partnership", "vorstand@sonnenblume-mg.com"],
    ["volunteering", "vorstand@sonnenblume-mg.com", "volunteering-events"],
    ["volunteering", "vorstand@sonnenblume-mg.com", "volunteering-own-idea"],
  ];
  const contacts = [];
  for (const [topic, expectedTarget, context] of contactCases) {
    const contact = await jsonRequest("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: "uk",
        name: "Smoke Test",
        email: `contact-${context || topic}-${suffix}@example.invalid`,
        topic,
        message: `Automated ${topic} contact queue smoke test.`,
        context,
        consent: true,
        company: "",
      }),
    });
    assert(contact.response.status === 201, `${topic} contact was not stored.`);
    contacts.push({ ...contact.body, expectedTarget, context });
  }

  for (const invalidFields of [
    { topic: "volunteering", consent: false },
    { topic: "membership", consent: true, statuteAccepted: false },
  ]) {
    const invalidContact = await jsonRequest("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: "uk",
        name: "Smoke Test",
        email: `invalid-${suffix}@example.invalid`,
        message: "This request must not be accepted without required consent.",
        company: "",
        ...invalidFields,
      }),
    });
    assert(
      invalidContact.response.status === 400 &&
        invalidContact.body.code === "invalid_contact",
      "A contact request without required consent was accepted.",
    );
  }

  const admin = await jsonRequest("/api/admin/operations");
  assert(admin.response.ok, "Local admin API is unavailable.");
  for (const contact of contacts) {
    const stored = admin.body.contacts.find(
      (item) => item.reference === contact.reference,
    );
    assert(stored, "Contact request is missing from admin API.");
    assert(
      stored.notificationTarget === contact.expectedTarget,
      `Contact was routed to ${stored.notificationTarget} instead of ${contact.expectedTarget}.`,
    );
    assert(
      stored.context === contact.context,
      "The selected volunteer role or own-idea context was lost.",
    );
  }

  const csv = await fetch(`${baseUrl}/api/admin/export?kind=contacts`);
  const csvText = await csv.text();
  assert(
    csv.ok && contacts.every((contact) => csvText.includes(contact.reference)),
    "CSV export is invalid.",
  );

  console.log(
    "Operations smoke test passed: closed registration, contact routing, volunteer context, required consent, admin and CSV.",
  );
} finally {
  if (backup === null) {
    await rm(dataFile, { force: true });
  } else {
    await writeFile(dataFile, backup, "utf8");
  }
}
