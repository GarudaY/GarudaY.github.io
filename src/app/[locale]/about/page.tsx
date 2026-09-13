import { notFound, permanentRedirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";

export const metadata = { robots: { index: false, follow: true } };

export default async function LegacyAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  permanentRedirect(getPath(locale, "home"));
}
