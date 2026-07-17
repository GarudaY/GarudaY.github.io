import Link from "next/link";
import { getPath } from "@/i18n/routing";
import { defaultLocale } from "@/i18n/config";
import { Container } from "@/components/ui/Container";

export default function LocaleNotFound() {
  return (
    <Container className="py-24">
      <div className="max-w-xl rounded-[8px] border border-border bg-surface p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold text-blue-strong">
          Сторінку не знайдено
        </h1>
        <p className="mt-4 leading-7 text-ink-muted">
          Маршрут або матеріал ще не опублікований у demo-контенті.
        </p>
        <Link
          href={getPath(defaultLocale, "home")}
          className="focus-ring mt-6 inline-flex rounded-full bg-blue-strong px-5 py-3 text-sm font-semibold text-white"
        >
          На головну
        </Link>
      </div>
    </Container>
  );
}
