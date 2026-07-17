import type { Locale } from "@/i18n/config";

export type RegistrationStatus = "confirmed" | "waitlist" | "cancelled";
export type RegistrationGroup = "adults" | "family" | "children";
export type ContactStatus = "new" | "in_progress" | "resolved";
export type ContactTopic = "courses" | "events" | "donation" | "partnership";

export type EventRegistration = {
  id: string;
  reference: string;
  cancellationToken: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  locale: Locale;
  name: string;
  email: string;
  participants: number;
  group: RegistrationGroup;
  note?: string;
  status: RegistrationStatus;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
};

export type ContactSubmission = {
  id: string;
  reference: string;
  locale: Locale;
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
  context?: string;
  status: ContactStatus;
  consentAt: string;
  createdAt: string;
  updatedAt: string;
};

export type OperationsStore = {
  version: 1;
  registrations: EventRegistration[];
  contacts: ContactSubmission[];
};

export type RegistrationAvailability = {
  eventSlug: string;
  capacity: number;
  remainingSeats: number;
  confirmedParticipants: number;
  waitlistPeople: number;
};

export type RegistrationReceipt = {
  reference: string;
  participants: number;
  status: Exclude<RegistrationStatus, "cancelled">;
  cancellationPath: string;
  remainingSeats: number;
};

export type ContactReceipt = {
  reference: string;
  status: ContactStatus;
};

export type AdminRegistration = Omit<
  EventRegistration,
  "cancellationToken"
>;
export type AdminContact = ContactSubmission;
