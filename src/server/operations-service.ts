import "server-only";
import { getEventBySlug } from "@/data/content";
import { t } from "@/lib/localize";
import { readOperationsStore, updateOperationsStore } from "@/server/operations-store";
import type {
  ContactStatus,
  ContactSubmission,
  EventRegistration,
  OperationsStore,
  RegistrationAvailability,
  RegistrationReceipt,
} from "@/types/operations";
import type { z } from "zod";
import type {
  contactRequestSchema,
  registrationRequestSchema,
} from "@/server/operations-validation";

type RegistrationInput = z.infer<typeof registrationRequestSchema>;
type ContactInput = z.infer<typeof contactRequestSchema>;

export class OperationsError extends Error {
  constructor(
    public code: string,
    public status = 400,
  ) {
    super(code);
  }
}

function reference(prefix: "REG" | "MSG") {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
  return `${prefix}-${date}-${suffix}`;
}

function cancellationToken() {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto
    .randomUUID()
    .replaceAll("-", "")}`;
}

function availabilityFromStore(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>,
  store: OperationsStore,
): RegistrationAvailability {
  const eventRegistrations = store.registrations.filter(
    (item) => item.eventId === event.id,
  );
  const confirmedParticipants = eventRegistrations
    .filter((item) => item.status === "confirmed")
    .reduce((total, item) => total + item.participants, 0);
  const waitlistPeople = eventRegistrations
    .filter((item) => item.status === "waitlist")
    .reduce((total, item) => total + item.participants, 0);

  return {
    eventSlug: event.slug,
    capacity: event.capacity,
    confirmedParticipants,
    remainingSeats: Math.max(0, event.seatsAvailable - confirmedParticipants),
    waitlistPeople,
  };
}

async function promoteWaitlist(store: OperationsStore, eventSlug: string) {
  const event = await getEventBySlug(eventSlug);
  if (!event) return;

  let { remainingSeats } = availabilityFromStore(event, store);
  const waitlist = store.registrations
    .filter(
      (item) => item.eventId === event.id && item.status === "waitlist",
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  for (const item of waitlist) {
    if (item.participants > remainingSeats) break;
    item.status = "confirmed";
    item.updatedAt = new Date().toISOString();
    remainingSeats -= item.participants;
  }
}

export async function getRegistrationAvailability(eventSlug: string) {
  const event = await getEventBySlug(eventSlug);
  if (!event || event.eventStatus !== "upcoming") return null;
  const store = await readOperationsStore();
  return availabilityFromStore(event, store);
}

export async function createRegistration(
  input: RegistrationInput,
): Promise<RegistrationReceipt> {
  const event = await getEventBySlug(input.eventSlug);
  if (!event || event.eventStatus !== "upcoming") {
    throw new OperationsError("event_unavailable", 404);
  }

  return updateOperationsStore((store) => {
    const duplicate = store.registrations.find(
      (item) =>
        item.eventId === event.id &&
        item.email === input.email &&
        item.status !== "cancelled",
    );
    if (duplicate) throw new OperationsError("duplicate_registration", 409);

    const now = new Date().toISOString();
    const availability = availabilityFromStore(event, store);
    const status =
      input.participants <= availability.remainingSeats
        ? "confirmed"
        : "waitlist";
    const token = cancellationToken();
    const registration: EventRegistration = {
      id: crypto.randomUUID(),
      reference: reference("REG"),
      cancellationToken: token,
      eventId: event.id,
      eventSlug: event.slug,
      eventTitle: t(event.title, input.locale),
      locale: input.locale,
      name: input.name,
      email: input.email,
      participants: input.participants,
      group: input.group,
      note: input.note,
      status,
      consentAt: now,
      createdAt: now,
      updatedAt: now,
    };
    store.registrations.push(registration);

    return {
      reference: registration.reference,
      participants: registration.participants,
      status,
      cancellationPath: `/${input.locale}/registration/${token}`,
      remainingSeats:
        status === "confirmed"
          ? availability.remainingSeats - registration.participants
          : availability.remainingSeats,
    };
  });
}

export async function getRegistrationByToken(token: string) {
  const store = await readOperationsStore();
  const item = store.registrations.find(
    (registration) => registration.cancellationToken === token,
  );
  if (!item) return null;

  return {
    id: item.id,
    reference: item.reference,
    eventSlug: item.eventSlug,
    eventTitle: item.eventTitle,
    locale: item.locale,
    participants: item.participants,
    status: item.status,
    createdAt: item.createdAt,
    cancelledAt: item.cancelledAt,
  };
}

async function cancelRegistrationMatching(
  matcher: (item: EventRegistration) => boolean,
) {
  return updateOperationsStore(async (store) => {
    const item = store.registrations.find(matcher);
    if (!item) throw new OperationsError("registration_not_found", 404);
    if (item.status !== "cancelled") {
      const now = new Date().toISOString();
      item.status = "cancelled";
      item.cancelledAt = now;
      item.updatedAt = now;
      await promoteWaitlist(store, item.eventSlug);
    }
    return { reference: item.reference, status: item.status };
  });
}

export async function cancelRegistrationByToken(token: string) {
  return cancelRegistrationMatching((item) => item.cancellationToken === token);
}

export async function cancelRegistrationById(id: string) {
  return cancelRegistrationMatching((item) => item.id === id);
}

export async function createContactSubmission(input: ContactInput) {
  return updateOperationsStore((store) => {
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    const duplicate = store.contacts.find(
      (item) =>
        item.email === input.email &&
        item.message === input.message &&
        new Date(item.createdAt).getTime() >= tenMinutesAgo,
    );
    if (duplicate) throw new OperationsError("duplicate_contact", 409);

    const now = new Date().toISOString();
    const contact: ContactSubmission = {
      id: crypto.randomUUID(),
      reference: reference("MSG"),
      locale: input.locale,
      name: input.name,
      email: input.email,
      topic: input.topic,
      message: input.message,
      context: input.context,
      status: "new",
      consentAt: now,
      createdAt: now,
      updatedAt: now,
    };
    store.contacts.push(contact);
    return { reference: contact.reference, status: contact.status };
  });
}

export async function updateContactStatus(id: string, status: ContactStatus) {
  return updateOperationsStore((store) => {
    const item = store.contacts.find((contact) => contact.id === id);
    if (!item) throw new OperationsError("contact_not_found", 404);
    item.status = status;
    item.updatedAt = new Date().toISOString();
    return item;
  });
}

export async function getAdminOperations() {
  const store = await readOperationsStore();
  return {
    registrations: store.registrations
      .map((item) => {
        const safeItem: Omit<EventRegistration, "cancellationToken"> & {
          cancellationToken?: string;
        } = { ...item };
        delete safeItem.cancellationToken;
        return safeItem;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    contacts: [...store.contacts].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
  };
}
