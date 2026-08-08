import "server-only";
import nodemailer from "nodemailer";
import type { Locale } from "@/i18n/config";
import type {
  ContactSubmission,
  ContactTopic,
  EventRegistration,
} from "@/types/operations";

type NotificationRoute = {
  formId: string;
  target: string;
};

type ContactForm7Response = {
  status?: string;
  message?: string;
  invalid_fields?: unknown[];
};

const contactForm7BaseUrl =
  process.env.WORDPRESS_CF7_BASE_URL?.trim() ||
  "https://sonnenblume-mg.com/wp-json/contact-form-7/v1/contact-forms";

const routeEnvironmentKeys: Record<
  ContactTopic | "registration",
  { formId: string; target: string }
> = {
  general: {
    formId: "WORDPRESS_CF7_FORM_ID_DEFAULT",
    target: "FORM_RECIPIENT_DEFAULT",
  },
  courses: {
    formId: "WORDPRESS_CF7_FORM_ID_COURSES",
    target: "FORM_RECIPIENT_COURSES",
  },
  events: {
    formId: "WORDPRESS_CF7_FORM_ID_EVENTS",
    target: "FORM_RECIPIENT_EVENTS",
  },
  volunteering: {
    formId: "WORDPRESS_CF7_FORM_ID_VOLUNTEERING",
    target: "FORM_RECIPIENT_VOLUNTEERING",
  },
  membership: {
    formId: "WORDPRESS_CF7_FORM_ID_MEMBERSHIP",
    target: "FORM_RECIPIENT_MEMBERSHIP",
  },
  donation: {
    formId: "WORDPRESS_CF7_FORM_ID_DONATION",
    target: "FORM_RECIPIENT_DONATION",
  },
  partnership: {
    formId: "WORDPRESS_CF7_FORM_ID_PARTNERSHIP",
    target: "FORM_RECIPIENT_PARTNERSHIP",
  },
  registration: {
    formId: "WORDPRESS_CF7_FORM_ID_REGISTRATION",
    target: "FORM_RECIPIENT_REGISTRATION",
  },
};

const fallbackTargets: Record<ContactTopic | "registration", string> = {
  general: "kontakt@sonnenblume-mg.com",
  courses: "kurse@sonnenblume-mg.com",
  events: "kurse@sonnenblume-mg.com",
  registration: "kurse@sonnenblume-mg.com",
  volunteering: "vorstand@sonnenblume-mg.com",
  membership: "vorstand@sonnenblume-mg.com",
  donation: "vorstand@sonnenblume-mg.com",
  partnership: "vorstand@sonnenblume-mg.com",
};

function routeFor(kind: ContactTopic | "registration"): NotificationRoute {
  const keys = routeEnvironmentKeys[kind];
  return {
    formId:
      process.env[keys.formId]?.trim() ||
      process.env.WORDPRESS_CF7_FORM_ID_DEFAULT?.trim() ||
      "85",
    target:
      process.env[keys.target]?.trim() ||
      process.env.FORM_RECIPIENT_DEFAULT?.trim() ||
      fallbackTargets[kind],
  };
}

function localeName(locale: Locale) {
  return locale === "uk" ? "Українська" : "Deutsch";
}

function topicName(topic: ContactTopic, locale: Locale) {
  const names: Record<ContactTopic, Record<Locale, string>> = {
    general: { uk: "Загальні питання", de: "Allgemeine Anfrage" },
    courses: { uk: "Курси", de: "Kurse" },
    events: { uk: "Події", de: "Veranstaltungen" },
    volunteering: { uk: "Волонтерство", de: "Ehrenamt" },
    membership: { uk: "Членство", de: "Mitgliedschaft" },
    donation: { uk: "Пожертви", de: "Spenden" },
    partnership: { uk: "Співпраця", de: "Partnerschaft" },
  };
  return names[topic][locale];
}

async function submitContactForm7({
  route,
  name,
  email,
  subject,
  message,
}: {
  route: NotificationRoute;
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const form = new FormData();
  form.set("_wpcf7", route.formId);
  form.set("_wpcf7_version", "6.1.6");
  form.set("_wpcf7_locale", "ru_RU");
  form.set("_wpcf7_unit_tag", `wpcf7-f${route.formId}-o1`);
  form.set("_wpcf7_container_post", "0");
  form.set("your-name", name);
  form.set("your-email", email);
  form.set("your-subject", subject);
  form.set("your-message", message);

  const response = await fetch(
    `${contactForm7BaseUrl}/${encodeURIComponent(route.formId)}/feedback`,
    {
      method: "POST",
      body: form,
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );
  const result = (await response
    .json()
    .catch(() => ({}))) as ContactForm7Response;
  if (!response.ok || result.status !== "mail_sent") {
    throw new Error(result.status || `cf7_http_${response.status}`);
  }
}

async function submitSmtp({
  route,
  name,
  email,
  subject,
  message,
}: {
  route: NotificationRoute;
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) {
    throw new Error("smtp_not_configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number.parseInt(process.env.SMTP_PORT ?? "465", 10),
    secure: true,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transporter.sendMail({
    from: {
      name: "SONNENBLUME — Website",
      address: process.env.SMTP_FROM?.trim() || user,
    },
    to: route.target,
    replyTo: { name, address: email },
    subject,
    text: message,
  });
}

async function sendNotification(payload: Parameters<typeof submitSmtp>[0]) {
  const transport = process.env.FORM_NOTIFICATION_TRANSPORT?.trim();
  if (transport === "smtp") return submitSmtp(payload);
  if (transport === "cf7") return submitContactForm7(payload);
  throw new Error("notification_transport_not_configured");
}

export function contactNotificationTarget(topic: ContactTopic) {
  return routeFor(topic).target;
}

export function registrationNotificationTarget() {
  return routeFor("registration").target;
}

export async function sendContactNotification(contact: ContactSubmission) {
  const route = routeFor(contact.topic);
  const subject = `[${contact.reference}] ${topicName(contact.topic, contact.locale)} — ${contact.name}`;
  const message = [
    `Номер / Referenz: ${contact.reference}`,
    `Тема / Thema: ${topicName(contact.topic, contact.locale)}`,
    `Мова / Sprache: ${localeName(contact.locale)}`,
    `Ім'я / Name: ${contact.name}`,
    `Email: ${contact.email}`,
    contact.context ? `Контекст / Kontext: ${contact.context}` : null,
    "",
    contact.message,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  await sendNotification({
    route,
    name: contact.name,
    email: contact.email,
    subject,
    message,
  });
}

export async function sendRegistrationNotification(
  registration: EventRegistration,
) {
  const route = routeFor("registration");
  const subject = `[${registration.reference}] Реєстрація — ${registration.eventTitle}`;
  const status =
    registration.status === "confirmed" ? "підтверджено" : "список очікування";
  const message = [
    `Номер / Referenz: ${registration.reference}`,
    `Подія / Veranstaltung: ${registration.eventTitle}`,
    `Статус / Status: ${status}`,
    `Ім'я / Name: ${registration.name}`,
    `Email: ${registration.email}`,
    `Учасників / Personen: ${registration.participants}`,
    `Група / Gruppe: ${registration.group}`,
    `Мова / Sprache: ${localeName(registration.locale)}`,
    registration.note ? `Примітка / Hinweis: ${registration.note}` : null,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  await sendNotification({
    route,
    name: registration.name,
    email: registration.email,
    subject,
    message,
  });
}
