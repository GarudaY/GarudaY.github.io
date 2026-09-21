import { z } from "zod";
import type { Person } from "../types/content";

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
export const cmsPersonSchema = z
  .object({
    id: z
      .string()
      .regex(/^person-[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(77),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(70),
    name: translated(120),
    roleLabel: translated(160),
    bio: translated(8000),
    teacherRoleLabel: translated(160, false),
    teacherBio: translated(3000, false),
    roles: z
      .array(z.enum(["board", "team", "teacher", "volunteer"]))
      .min(1)
      .max(4),
    boardPosition: z.enum(["chair", "member"]).nullable(),
    languages: z.array(z.string().regex(/^[a-z]{2,8}$/)).max(10),
    relatedCourseIds: z
      .array(
        z
          .string()
          .regex(/^course-[a-z0-9-]+$/)
          .max(80),
      )
      .max(50),
    order: z.number().int().min(0).max(999),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    image: z
      .object({
        url: z.url(),
        alt: translated(180),
        focus: z.number().int().min(0).max(100),
      })
      .nullable(),
  })
  .superRefine((person, context) => {
    if (
      person.id !== `person-${person.slug}` ||
      new Set(person.roles).size !== person.roles.length
    )
      context.addIssue({
        code: "custom",
        message: "Invalid stable profile identity or duplicate roles",
      });
    if (person.roles.includes("board") !== (person.boardPosition !== null))
      context.addIssue({
        code: "custom",
        message: "Board position requires the board role",
      });
    if (
      person.roles.includes("teacher") &&
      ["uk", "de"].some(
        (locale) =>
          !person.teacherRoleLabel[locale as "uk" | "de"] ||
          !person.teacherBio[locale as "uk" | "de"],
      )
    )
      context.addIssue({
        code: "custom",
        message: "Teacher description requires both translations",
      });
  });

export function parseCmsPeople(payload: unknown, cmsUrl: URL): Person[] {
  const { items } = z
    .object({
      schemaVersion: z.literal(1),
      items: z.array(cmsPersonSchema).max(200),
    })
    .parse(payload);
  if (
    new Set(items.map((person) => person.id)).size !== items.length ||
    new Set(items.map((person) => person.slug)).size !== items.length
  )
    throw new Error("Duplicate CMS profile identity");
  if (items.filter((person) => person.boardPosition === "chair").length > 1)
    throw new Error("Only one published board chair is allowed");
  return items
    .sort((a, b) => a.order - b.order)
    .map((person) => {
      if (person.image) {
        const image = new URL(person.image.url);
        if (
          image.origin !== cmsUrl.origin ||
          !image.pathname.includes("/wp-content/uploads/") ||
          image.username ||
          image.password ||
          image.hash ||
          image.search
        )
          throw new Error(
            "Profile photo must belong to its own WordPress media library",
          );
      }
      return {
        ...person,
        status: "published",
        boardPosition: person.boardPosition ?? undefined,
        isDemo: false,
        teacherRoleLabel: person.roles.includes("teacher")
          ? person.teacherRoleLabel
          : undefined,
        teacherBio: person.roles.includes("teacher")
          ? person.teacherBio
          : undefined,
        image: person.image
          ? {
              src: person.image.url,
              alt: person.image.alt,
              focus: person.image.focus,
            }
          : undefined,
        seo: {
          title: person.name,
          description: {
            uk: person.bio.uk.slice(0, 160),
            de: person.bio.de.slice(0, 160),
          },
        },
      };
    });
}
