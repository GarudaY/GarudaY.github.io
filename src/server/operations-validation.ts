import "server-only";
import { z } from "zod";

const localeSchema = z.enum(["uk", "de"]);
const dateTimeSchema = z.string().datetime({ offset: true });

export const registrationRequestSchema = z.object({
  locale: localeSchema,
  eventSlug: z.string().trim().min(2).max(120).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  participants: z.coerce.number().int().min(1).max(5),
  group: z.enum(["adults", "family", "children"]),
  note: z.string().trim().max(1000).optional().transform((value) => value || undefined),
  consent: z.literal(true),
  company: z.string().max(0).optional(),
});

export const contactRequestSchema = z.object({
  locale: localeSchema,
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(200),
  topic: z.enum(["courses", "events", "donation", "partnership"]),
  message: z.string().trim().min(5).max(3000),
  context: z.string().trim().max(240).optional().transform((value) => value || undefined),
  consent: z.literal(true),
  company: z.string().max(0).optional(),
});

export const registrationSchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  cancellationToken: z.string(),
  eventId: z.string(),
  eventSlug: z.string(),
  eventTitle: z.string(),
  locale: localeSchema,
  name: z.string(),
  email: z.string().email(),
  participants: z.number().int().positive(),
  group: z.enum(["adults", "family", "children"]),
  note: z.string().optional(),
  status: z.enum(["confirmed", "waitlist", "cancelled"]),
  consentAt: dateTimeSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
  cancelledAt: dateTimeSchema.optional(),
});

export const contactSubmissionSchema = z.object({
  id: z.string().uuid(),
  reference: z.string(),
  locale: localeSchema,
  name: z.string(),
  email: z.string().email(),
  topic: z.enum(["courses", "events", "donation", "partnership"]),
  message: z.string(),
  context: z.string().optional(),
  status: z.enum(["new", "in_progress", "resolved"]),
  consentAt: dateTimeSchema,
  createdAt: dateTimeSchema,
  updatedAt: dateTimeSchema,
});

export const operationsStoreSchema = z.object({
  version: z.literal(1),
  registrations: z.array(registrationSchema),
  contacts: z.array(contactSubmissionSchema),
});

export const adminUpdateSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("contact"),
    id: z.string().uuid(),
    status: z.enum(["new", "in_progress", "resolved"]),
  }),
  z.object({
    kind: z.literal("registration"),
    id: z.string().uuid(),
    action: z.literal("cancel"),
  }),
]);
