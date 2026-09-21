import { z } from "zod";
import type { VolunteerOpportunity } from "../types/content";

const translated = (max: number) =>
  z.object({
    uk: z.string().trim().min(1).max(max),
    de: z.string().trim().min(1).max(max),
  });

export const cmsVolunteerSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(70),
  icon: z.enum(["calendar", "camera", "languages", "list", "heart"]),
  title: translated(160),
  description: translated(1200),
  time: translated(180),
  location: translated(180),
  order: z.number().int().min(0).max(999),
});

export function parseCmsVolunteer(payload: unknown): VolunteerOpportunity[] {
  const { items } = z
    .object({
      schemaVersion: z.literal(1),
      items: z.array(cmsVolunteerSchema).max(200),
    })
    .parse(payload);
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error("Duplicate volunteer task identity");
  return items.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}
