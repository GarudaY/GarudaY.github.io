import { z } from "zod";
import type { Course } from "../types/content";

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
const translatedList = (required: boolean) =>
  z.object({
    uk: z
      .array(z.string().trim().min(1).max(300))
      .min(required ? 1 : 0)
      .max(12),
    de: z
      .array(z.string().trim().min(1).max(300))
      .min(required ? 1 : 0)
      .max(12),
  });
const courseId = z
  .string()
  .regex(/^course-[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(77);
const personId = z
  .string()
  .regex(/^person-[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(77);

export const cmsCourseSchema = z
  .object({
    id: courseId,
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(70),
    enrollmentStatus: z.enum(["open", "waitlist", "closed", "planned"]),
    category: z.enum([
      "language",
      "children",
      "culture",
      "integration",
      "creative",
    ]),
    title: translated(160),
    summary: translated(500),
    description: translated(8000),
    outcomes: translatedList(true),
    materials: translatedList(false),
    ageGroup: translated(160),
    language: translated(160),
    format: translated(160),
    location: translated(300),
    schedule: z
      .array(
        z.object({
          weekday: translated(160),
          time: z.string().trim().min(1).max(80),
          cadence: translated(160),
        }),
      )
      .max(8),
    price: translated(300),
    startsAt: z.union([z.literal(""), z.iso.date()]),
    duration: translated(160),
    seatsTotal: z.number().int().min(0).max(10000),
    seatsAvailable: z.number().int().min(0).max(10000),
    teacherIds: z.array(personId).max(10),
    relatedCourseIds: z.array(courseId).max(20),
    image: z.object({
      url: z.url(),
      alt: translated(180),
      focus: z.number().int().min(0).max(100),
    }),
    isFeatured: z.boolean(),
    order: z.number().int().min(0).max(999),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .superRefine((course, context) => {
    for (const values of [course.teacherIds, course.relatedCourseIds])
      if (new Set(values).size !== values.length)
        context.addIssue({
          code: "custom",
          message: "Duplicate course relationship",
        });
    if (course.relatedCourseIds.includes(course.id))
      context.addIssue({
        code: "custom",
        message: "Course cannot relate to itself",
      });
    if (
      course.seatsAvailable > course.seatsTotal ||
      (course.seatsTotal === 0 && course.seatsAvailable !== 0)
    )
      context.addIssue({
        code: "custom",
        message: "Invalid displayed seat count",
      });
  });

export function parseCmsCourses(payload: unknown, cmsUrl: URL): Course[] {
  const { items } = z
    .object({
      schemaVersion: z.literal(1),
      items: z.array(cmsCourseSchema).max(200),
    })
    .parse(payload);
  const ids = new Set(items.map((course) => course.id));
  if (
    ids.size !== items.length ||
    new Set(items.map((course) => course.slug)).size !== items.length
  )
    throw new Error("Duplicate CMS course identity");
  for (const course of items) {
    for (const related of course.relatedCourseIds)
      if (!ids.has(related))
        throw new Error("CMS course links to an unavailable course");
    const image = new URL(course.image.url);
    if (
      image.origin !== cmsUrl.origin ||
      !image.pathname.includes("/wp-content/uploads/") ||
      image.username ||
      image.password ||
      image.hash ||
      image.search
    )
      throw new Error(
        "Course image must belong to its own WordPress media library",
      );
  }
  return items
    .sort((a, b) => a.order - b.order)
    .map((course) => ({
      ...course,
      status: "published",
      image: {
        src: course.image.url,
        alt: course.image.alt,
        focus: course.image.focus,
      },
      seo: {
        title: course.title,
        description: {
          uk: course.summary.uk.slice(0, 160),
          de: course.summary.de.slice(0, 160),
        },
      },
    }));
}
