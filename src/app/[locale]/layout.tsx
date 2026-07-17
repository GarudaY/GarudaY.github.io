import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { isLocale, locales, type Locale } from "@/i18n/config";
import { getNavigation, getSiteSettings } from "@/data/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { siteConfig } from "@/config/site";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!isLocale(locale)) return {};

  return {
    title: {
      default: siteConfig.organizationName[locale],
      template: `%s | ${siteConfig.shortName[locale]}`,
    },
    metadataBase: new URL(siteConfig.baseUrl),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const [settings, navigation] = await Promise.all([
    getSiteSettings(),
    getNavigation(),
  ]);

  return (
    <html lang={locale} className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col">
          <a href="#main-content" className="skip-link">
            {locale === "uk"
              ? "Перейти до основного вмісту"
              : "Zum Hauptinhalt springen"}
          </a>
          <Header locale={locale} navigation={navigation} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer locale={locale} settings={settings} />
        </div>
      </body>
    </html>
  );
}
