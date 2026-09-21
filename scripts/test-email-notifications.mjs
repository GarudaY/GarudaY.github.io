import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(
  new URL("../src/server/email-notifications.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
});
const environmentKeys = Object.keys(process.env).filter((key) =>
  /^(SMTP_|FORM_|WORDPRESS_CF7_)/.test(key),
);
const originals = new Map(
  environmentKeys.map((key) => [key, process.env[key]]),
);
const transports = [];
const messages = [];
let sendError = null;
const compiledModule = { exports: {} };
const compile = new Function("require", "module", "exports", outputText);
compile(
  (name) => {
    if (name === "server-only") return {};
    if (name === "nodemailer")
      return {
        createTransport(options) {
          transports.push(options);
          return {
            async sendMail(message) {
              if (sendError) throw sendError;
              messages.push(message);
              return { accepted: [message.to], rejected: [] };
            },
          };
        },
      };
    throw new Error(
      `Unexpected runtime dependency in notification test: ${name}`,
    );
  },
  compiledModule,
  compiledModule.exports,
);

const notifications = compiledModule.exports;
function reset() {
  for (const key of Object.keys(process.env))
    if (/^(SMTP_|FORM_|WORDPRESS_CF7_)/.test(key)) delete process.env[key];
  process.env.FORM_NOTIFICATION_TRANSPORT = "smtp";
  process.env.SMTP_HOST = "smtp.example.invalid";
  process.env.SMTP_USER = "sender@example.invalid";
  process.env.SMTP_PASSWORD = "mock-password-not-a-credential";
  transports.length = 0;
  messages.length = 0;
  sendError = null;
}
test.after(() => {
  for (const key of Object.keys(process.env))
    if (/^(SMTP_|FORM_|WORDPRESS_CF7_)/.test(key)) delete process.env[key];
  for (const [key, value] of originals) process.env[key] = value;
});
test.beforeEach(reset);

function contact(topic) {
  return {
    reference: "MSG-TEST",
    topic,
    locale: "de",
    name: "Website Test",
    email: "reply@example.invalid",
    context: "volunteering-events",
    message: "A test message with its selected role.",
  };
}

test("all contact topics use the correct recipient, Reply-To and role context", async () => {
  const routes = {
    general: "kontakt@sonnenblume-mg.com",
    courses: "kurse@sonnenblume-mg.com",
    events: "kurse@sonnenblume-mg.com",
    volunteering: "vorstand@sonnenblume-mg.com",
    membership: "vorstand@sonnenblume-mg.com",
    donation: "vorstand@sonnenblume-mg.com",
    partnership: "vorstand@sonnenblume-mg.com",
  };
  for (const [topic, recipient] of Object.entries(routes)) {
    await notifications.sendContactNotification(contact(topic));
    const message = messages.at(-1);
    assert.equal(message.to, recipient);
    assert.equal(message.replyTo.address, "reply@example.invalid");
    assert.equal(message.from.address, "sender@example.invalid");
    assert.match(message.text, /volunteering-events/);
    assert.match(message.subject, /MSG-TEST/);
  }
  assert.equal(transports[0].port, 465);
  assert.equal(transports[0].secure, true);
});

test("recipient overrides and encrypted STARTTLS on port 587 work", async () => {
  process.env.SMTP_PORT = "587";
  process.env.SMTP_FROM = "website@example.invalid";
  process.env.FORM_RECIPIENT_COURSES = "courses@example.invalid";
  await notifications.sendContactNotification(contact("courses"));
  assert.equal(messages[0].to, "courses@example.invalid");
  assert.equal(messages[0].from.address, "website@example.invalid");
  assert.equal(transports[0].port, 587);
  assert.equal(transports[0].secure, false);
  assert.equal(transports[0].requireTLS, true);
});

test("invalid SMTP settings fail instead of falsely reporting a send", async () => {
  process.env.SMTP_PORT = "465invalid";
  await assert.rejects(
    notifications.sendContactNotification(contact("general")),
    /smtp_invalid_port/,
  );
  delete process.env.SMTP_PASSWORD;
  await assert.rejects(
    notifications.sendContactNotification(contact("general")),
    /smtp_not_configured/,
  );
  assert.equal(messages.length, 0);
});

test("registration notifications use the course inbox and include participant count", async () => {
  await notifications.sendRegistrationNotification({
    reference: "REG-TEST",
    locale: "uk",
    eventTitle: "Test Event",
    status: "confirmed",
    name: "Website Test",
    email: "reply@example.invalid",
    participants: 3,
    group: "family",
  });
  assert.equal(messages[0].to, "kurse@sonnenblume-mg.com");
  assert.match(messages[0].text, /Personen: 3/);
});

test("SMTP delivery failures propagate instead of reporting a successful send", async () => {
  sendError = new Error("SMTP authentication failed");
  await assert.rejects(
    notifications.sendContactNotification(contact("general")),
    /SMTP authentication failed/,
  );
  assert.equal(messages.length, 0);
});
