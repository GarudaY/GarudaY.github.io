import examples from "@/content/mock/verein-updates.json";
import { connection } from "next/server";
import snapshot from "@/content/cms-static-snapshot.json";
import {
  parseVereinUpdates,
  vereinUpdateSchema,
  wordpressNewsEndpoint,
} from "@/lib/verein-updates";

export async function getVereinUpdates() {
  // Runtime CMS settings can be supplied after the build (Cloudflare/Sites).
  // Do not freeze the homepage into mock HTML when build-time CMS settings are absent.
  if (process.env.GITHUB_PAGES_EXPORT !== "true") await connection();
  const base = process.env.WORDPRESS_CMS_URL;
  if (!base) return examples.map((item) => vereinUpdateSchema.parse(item));
  try {
    const endpoint = wordpressNewsEndpoint(
      base,
      process.env.NODE_ENV === "development",
    );
    const isExport = process.env.GITHUB_PAGES_EXPORT === "true";
    if (isExport) {
      if (
        snapshot.origin !== endpoint.origin + endpoint.pathname ||
        snapshot.news === null
      )
        throw new Error(
          "A matching published CMS snapshot is required for Pages export",
        );
      return parseVereinUpdates(snapshot.news, endpoint);
    }
    const response = await fetch(endpoint, {
      ...(process.env.NODE_ENV === "development"
        ? { cache: "no-store" as const }
        : isExport
          ? { cache: "force-cache" as const }
          : { next: { revalidate: 60 } }),
      signal: AbortSignal.timeout(5000),
      redirect: "error",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`CMS returned HTTP ${response.status}`);
    if (Number(response.headers.get("content-length")) > 1_000_000)
      throw new Error("CMS response too large");
    const text = await response.text();
    if (text.length > 1_000_000) throw new Error("CMS response too large");
    // An intentionally empty collection stays empty: removed news must not reappear as examples.
    return parseVereinUpdates(JSON.parse(text), endpoint);
  } catch (error) {
    console.error(
      "[CMS news] Published feed unavailable; explicitly labelled examples shown.",
      error instanceof Error ? error.message : "Invalid feed",
    );
    if (process.env.GITHUB_PAGES_EXPORT === "true")
      throw new Error(
        "Configured WordPress CMS must be available for a static production build",
      );
    return examples.map((item) => vereinUpdateSchema.parse(item));
  }
}
