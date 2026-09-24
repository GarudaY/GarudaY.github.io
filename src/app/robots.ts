import type { MetadataRoute } from "next";
import { isPreviewSite, siteConfig } from "@/config/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: isPreviewSite()
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteConfig.baseUrl).toString(),
  };
}
