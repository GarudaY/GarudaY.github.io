import { notFound, permanentRedirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export default async function NewsRedirectPage({ params }: PageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  permanentRedirect(getPath(locale, "events"));
}
