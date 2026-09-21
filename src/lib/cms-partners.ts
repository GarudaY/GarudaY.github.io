import { z } from "zod";
import type { Partner } from "../types/content";

const translated = (max: number) => z.object({
  uk: z.string().trim().min(1).max(max),
  de: z.string().trim().min(1).max(max),
});

export const cmsPartnerSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(70),
  kind: z.enum(["organization", "person"]),
  name: z.string().trim().min(1).max(160),
  description: translated(800),
  website: z.string().max(500).refine((value) => value === "" || /^https:\/\/[^\s]+$/.test(value)),
  order: z.number().int().min(0).max(999),
  image: z.object({
    url: z.url(), alt: translated(180), focus: z.number().int().min(0).max(100),
  }).nullable(),
});

export function parseCmsPartners(payload: unknown, cmsUrl: URL): { initialized: boolean; items: Partner[] } {
  const feed = z.object({
    schemaVersion: z.literal(1), initialized: z.boolean(),
    items: z.array(cmsPartnerSchema).max(200),
  }).parse(payload);
  if (new Set(feed.items.map((item) => item.id)).size !== feed.items.length)
    throw new Error("Duplicate partner identity");
  return {
    initialized: feed.initialized,
    items: feed.items.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)).map((item) => {
      if (item.kind === "organization" && !item.image)
        throw new Error("Published organization requires a logo");
      if (item.website) {
        const website = new URL(item.website);
        if (website.username || website.password || website.protocol !== "https:")
          throw new Error("Invalid partner website");
      }
      if (item.image) {
        const image = new URL(item.image.url);
        if (image.origin !== cmsUrl.origin || !image.pathname.includes("/wp-content/uploads/") || image.username || image.password || image.search || image.hash)
          throw new Error("Partner image must belong to its own WordPress media library");
      }
      return {
        id: item.id, kind: item.kind, name: item.name, status: "published" as const,
        description: item.description, website: item.website || undefined, order: item.order,
        logo: item.image ? { src: item.image.url, alt: item.image.alt, fit: "contain" as const, focus: item.image.focus } : undefined,
      };
    }),
  };
}
