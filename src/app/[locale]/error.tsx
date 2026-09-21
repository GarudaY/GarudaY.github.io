"use client";

import { useParams } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { getPath } from "@/i18n/routing";

export default function PublicPageError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const params = useParams<{ locale: string }>();
  const locale = params.locale === "uk" ? "uk" : "de";
  const isUk = locale === "uk";
  return (
    <section
      className="mx-auto max-w-2xl px-5 py-20 text-center sm:py-28"
      aria-labelledby="page-error-title"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-yellow/25 text-blue-strong">
        <RefreshCw className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1
        id="page-error-title"
        className="mt-6 text-balance text-3xl font-bold text-blue-strong"
      >
        {isUk
          ? "Сторінка тимчасово недоступна"
          : "Diese Seite ist vorübergehend nicht verfügbar"}
      </h1>
      <p className="mt-4 text-base leading-7 text-ink-muted">
        {isUk
          ? "Не вдалося завантажити актуальний вміст. Спробуйте ще раз трохи пізніше або напишіть нашій команді."
          : "Die aktuellen Inhalte konnten nicht geladen werden. Versuchen Sie es später erneut oder schreiben Sie unserem Team."}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button onClick={retry}>
          {isUk ? "Спробувати ще раз" : "Erneut versuchen"}
        </Button>
        <LinkButton variant="ghost" href={getPath(locale, "contact")}>
          {isUk ? "Зв’язатися з нами" : "Kontakt aufnehmen"}
        </LinkButton>
      </div>
    </section>
  );
}
