import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/config";
import type { RouteKey } from "@/i18n/routing";
import {
  getAlternateLanguages,
  getCanonicalUrl,
  getPath,
} from "@/i18n/routing";

type MetadataInput = {
  locale: Locale;
  route: RouteKey;
  slug?: string;
  title: string;
  description: string;
  image?: string;
  noIndex?: boolean;
  openGraphType?: "website" | "article";
  publishedTime?: string;
};

export function buildMetadata({
  locale,
  route,
  slug,
  title,
  description,
  image = "/images/generated/community-hero-v1.webp",
  noIndex,
  openGraphType = "website",
  publishedTime,
}: MetadataInput): Metadata {
  const canonical = getCanonicalUrl(locale, route, slug);
  const imageUrl = new URL(image, siteConfig.baseUrl).toString();
  const openGraph: Metadata["openGraph"] =
    openGraphType === "article"
      ? {
          title,
          description,
          url: canonical,
          siteName: siteConfig.organizationName[locale],
          locale: locale === "uk" ? "uk_UA" : "de_DE",
          type: "article",
          publishedTime,
          images: [{ url: imageUrl, alt: title }],
        }
      : {
          title,
          description,
          url: canonical,
          siteName: siteConfig.organizationName[locale],
          locale: locale === "uk" ? "uk_UA" : "de_DE",
          type: "website",
          images: [{ url: imageUrl, alt: title }],
        };

  return {
    title: route === "home" ? { absolute: title } : title,
    description,
    metadataBase: new URL(siteConfig.baseUrl),
    alternates: {
      canonical,
      languages: getAlternateLanguages(route, slug),
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: imageUrl, alt: title }],
    },
    robots: noIndex ? { index: false, follow: false } : undefined,
  };
}

export function routeBreadcrumbJsonLd(
  locale: Locale,
  items: Array<{ label: string; route: RouteKey; slug?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: new URL(
        getPath(locale, item.route, item.slug),
        siteConfig.baseUrl,
      ).toString(),
    })),
  };
}
