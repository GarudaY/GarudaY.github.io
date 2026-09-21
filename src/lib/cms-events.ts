import { z } from "zod";
import type { Event, ImageAsset } from "../types/content";

const translated = (max: number, required = true) =>
  z.object({
    uk: z
      .string()
      .trim()
      .min(required ? 1 : 0)
      .max(max),
    de: z
      .string()
      .trim()
      .min(required ? 1 : 0)
      .max(max),
  });
const eventId = z
  .string()
  .regex(/^event-[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(97);
const courseId = z
  .string()
  .regex(/^course-[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(77);
const instant = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);
const media = z.object({
  url: z.url(),
  alt: translated(180),
  focus: z.number().int().min(0).max(100),
});

export const cmsEventSchema = z
  .object({
    id: eventId,
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(90),
    eventStatus: z.enum(["upcoming", "past", "cancelled"]),
    archiveType: z.literal("announcement").optional(),
    organizerName: z.string().trim().min(1).max(180).optional(),
    category: z.enum([
      "community",
      "culture",
      "children",
      "integration",
      "charity",
    ]),
    title: translated(180),
    summary: translated(600),
    description: translated(10000),
    startsAt: instant,
    endsAt: instant.optional(),
    dateLabel: translated(180).optional(),
    timeLabel: translated(180).optional(),
    location: translated(400),
    price: translated(300),
    registrationLabel: translated(180),
    capacity: z.literal(0),
    seatsAvailable: z.literal(0),
    contactEmail: z.email().max(254),
    image: media,
    gallery: z.array(media).max(12),
    relatedArticleIds: z.array(z.string().trim().min(1).max(97)).max(20),
    relatedCourseIds: z.array(courseId).max(20),
    isFeatured: z.boolean(),
    order: z.number().int().min(0).max(999),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .superRefine((event, context) => {
    for (const values of [event.relatedArticleIds, event.relatedCourseIds])
      if (new Set(values).size !== values.length)
        context.addIssue({
          code: "custom",
          message: "Duplicate event relationship",
        });
    if (event.endsAt && new Date(event.endsAt) < new Date(event.startsAt))
      context.addIssue({
        code: "custom",
        message: "Event ends before it starts",
      });
  });

function checkedMedia(value: z.infer<typeof media>, cmsUrl: URL): ImageAsset {
  const image = new URL(value.url);
  if (
    image.origin !== cmsUrl.origin ||
    !image.pathname.includes("/wp-content/uploads/") ||
    image.username ||
    image.password ||
    image.hash ||
    image.search
  )
    throw new Error(
      "Event image must belong to its own WordPress media library",
    );
  return { src: value.url, alt: value.alt, focus: value.focus };
}

export function parseCmsEvents(payload: unknown, cmsUrl: URL): Event[] {
  const { items } = z
    .object({
      schemaVersion: z.literal(1),
      items: z.array(cmsEventSchema).max(200),
    })
    .parse(payload);
  if (
    new Set(items.map((event) => event.id)).size !== items.length ||
    new Set(items.map((event) => event.slug)).size !== items.length
  )
    throw new Error("Duplicate CMS event identity");
  return items
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
        a.order - b.order,
    )
    .map(({ order: _order, image, gallery, ...event }) => {
      void _order;
      return {
        ...event,
        status: "published",
        image: checkedMedia(image, cmsUrl),
        gallery: gallery.map((item) => checkedMedia(item, cmsUrl)),
        seo: {
          title: event.title,
          description: {
            uk: event.summary.uk.slice(0, 160),
            de: event.summary.de.slice(0, 160),
          },
        },
      };
    });
}
