import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "SONNENBLUME — Ukraine Community MG e.V.",
    template: "%s | SONNENBLUME",
  },
  description:
    "Культура, освіта, інтеграція та волонтерство для української громади Мьонхенгладбаха.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://garuday.github.io",
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
