import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { ContentImage } from "@/components/ui/ContentImage";
import { cn } from "@/lib/cn";

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function PersonPortrait({
  person,
  locale,
  className,
  preload,
  sizes,
}: {
  person: Person;
  locale: Locale;
  className?: string;
  preload?: boolean;
  sizes?: string;
}) {
  if (person.image) {
    return (
      <ContentImage
        image={person.image}
        locale={locale}
        className={cn("isolate min-w-0 max-w-full", className)}
        preload={preload}
        sizes={sizes}
      />
    );
  }

  return (
    <div
      className={cn(
        "person-monogram relative isolate grid min-w-0 max-w-full overflow-hidden bg-blue-strong text-white",
        className,
      )}
      role="img"
      aria-label={
        locale === "uk"
          ? `Ініціали ${t(person.name, locale)}`
          : `Initialen von ${t(person.name, locale)}`
      }
    >
      <span aria-hidden="true" className="person-monogram-sun" />
      <span className="relative z-10 place-self-center text-5xl font-bold tracking-[-0.05em] sm:text-6xl">
        {initials(t(person.name, locale))}
      </span>
    </div>
  );
}
