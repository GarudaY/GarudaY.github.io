import buildSitemap from "@/server/site-sitemap";

// Request-time CMS people keep newly published/withdrawn profiles in sync.
export default async function sitemap() {
  return buildSitemap();
}
