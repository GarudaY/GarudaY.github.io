import type { Locale } from "@/i18n/config";

export type RegistrationStatus = "confirmed" | "waitlist" | "cancelled";
export type RegistrationGroup = "adults" | "family" | "children";
export type ContactStatus = "new" | "in_progress" | "resolved";
export type NotificationStatus = "pending" | "sent" | "failed";
export type ContactTopic =
  | "courses"
  | "events"
  | "volunteering"
  | "membership"
  | "donation"
  | "partnership";

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
  notificationStatus: NotificationStatus;
  notificationTarget: string;
  notificationSentAt?: string;
  notificationError?: string;
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
  notificationStatus: NotificationStatus;
  notificationTarget: string;
  notificationSentAt?: string;
  notificationError?: string;
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
  notificationStatus: NotificationStatus;
};

export type ContactReceipt = {
  reference: string;
  status: ContactStatus;
  notificationStatus: NotificationStatus;
};

export type AdminRegistration = Omit<EventRegistration, "cancellationToken">;
export type AdminContact = ContactSubmission;
