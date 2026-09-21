import { z } from "zod";

const translated = (max: number) =>
  z.object({
    uk: z.string().trim().min(1).max(max),
    de: z.string().trim().min(1).max(max),
  });

export const vereinUpdateSchema = z.object({
  id: z.union([z.number().int().positive(), z.string().min(1).max(80)]),
  title: translated(160),
  text: translated(1800),
  status: translated(70),
  icon: z.enum(["handshake", "lightbulb", "users"]),
  order: z.number().int().min(0).max(999),
  isExample: z.boolean(),
  publishedAt: z.iso.datetime({ offset: true }).nullable(),
  image: z
    .object({
      url: z.url(),
      alt: translated(180),
      focus: z.number().int().min(0).max(100),
    })
    .nullable(),
});

export type VereinUpdate = z.infer<typeof vereinUpdateSchema>;

export function parseVereinUpdates(
  payload: unknown,
  cmsUrl: URL,
): VereinUpdate[] {
  const result = z
    .object({
      schemaVersion: z.literal(1),
      items: z.array(vereinUpdateSchema).max(200),
    })
    .parse(payload);
  for (const item of result.items) {
    if (!item.image) continue;
    const imageUrl = new URL(item.image.url);
    if (
      imageUrl.origin !== cmsUrl.origin ||
      !imageUrl.pathname.includes("/wp-content/uploads/") ||
      imageUrl.username ||
      imageUrl.password
    ) {
      throw new Error(
        "CMS image must belong to its own WordPress media library",
      );
    }
  }
  if (
    new Set(result.items.map((item) => String(item.id))).size !==
    result.items.length
  )
    throw new Error("Duplicate CMS news IDs");
  return result.items.sort((a, b) => a.order - b.order).slice(0, 12);
}

export function wordpressNewsEndpoint(base: string, allowLocal = false): URL {
  const url = new URL(base);
  const loopback = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" &&
      !(allowLocal && loopback && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "WORDPRESS_CMS_URL must be an HTTPS site URL, without credentials or query parameters",
    );
  }
  url.pathname = url.pathname.replace(/\/*$/, "/");
  url.searchParams.set("rest_route", "/sonnenblume/v1/updates/public");
  return url;
}
