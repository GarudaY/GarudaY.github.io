import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "Український Verein у Німеччині",
    template: "%s | Український Verein",
  },
  description:
    "Курси, події та підтримка для української спільноти у Німеччині.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://example-verein.de",
  ),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="h-full" data-scroll-behavior="smooth">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
