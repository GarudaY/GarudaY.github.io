import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Languages,
  MapPin,
  Users,
} from "lucide-react";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { t } from "@/lib/localize";
import type { Course, Person } from "@/types/content";
import { Card } from "@/components/ui/Card";
import { ContentImage } from "@/components/ui/ContentImage";
import { CourseStatusBadge } from "@/components/content/StatusBadge";

const categoryLabels = {
  language: { uk: "Мовний курс", de: "Sprachkurs" },
  children: { uk: "Для дітей", de: "Für Kinder" },
  culture: { uk: "Культура", de: "Kultur" },
  integration: { uk: "Інтеграція", de: "Integration" },
  creative: { uk: "Творчість", de: "Kreativ" },
};

export function CourseCard({
  course,
  teachers,
  locale,
  eager,
}: {
  course: Course;
  teachers: Person[];
  locale: Locale;
  eager?: boolean;
}) {
  return (
    <Card className="group overflow-hidden">
      <Link
        href={getPath(locale, "courses", course.slug)}
        className="focus-ring block rounded-[18px]"
      >
        <ContentImage
          image={course.image}
          locale={locale}
          className="aspect-[4/3] rounded-none"
          sizes="(min-width: 1024px) 33vw, 100vw"
          eager={eager}
        />
        <div className="grid gap-4 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <CourseStatusBadge
              status={course.enrollmentStatus}
              locale={locale}
            />
            <span className="text-xs font-semibold text-ink-muted">
              {t(categoryLabels[course.category], locale)}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold leading-snug text-blue-strong group-hover:text-blue">
              {t(course.title, locale)}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-muted">
              {t(course.summary, locale)}
            </p>
          </div>
          <dl className="grid gap-2 text-sm text-ink-muted">
            <div className="flex gap-2">
              <Users
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-blue"
              />
              <dt className="sr-only">{locale === "uk" ? "Вік" : "Alter"}</dt>
              <dd>{t(course.ageGroup, locale)}</dd>
            </div>
            <div className="flex gap-2">
              <Languages
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-blue"
              />
              <dt className="sr-only">
                {locale === "uk" ? "Мова та формат" : "Sprache und Format"}
              </dt>
              <dd>
                {t(course.language, locale)} · {t(course.format, locale)}
              </dd>
            </div>
            <div className="flex gap-2">
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-blue"
              />
              <dt className="sr-only">
                {locale === "uk" ? "Розклад" : "Zeitplan"}
              </dt>
              <dd>
                {course.schedule
                  .map((item) => `${t(item.weekday, locale)} ${item.time}`)
                  .join(", ")}
              </dd>
            </div>
            <div className="flex gap-2">
              <MapPin
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-blue"
              />
              <dt className="sr-only">{locale === "uk" ? "Місце" : "Ort"}</dt>
              <dd>{t(course.location, locale)}</dd>
            </div>
          </dl>
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <div className="min-w-0">
              <p className="truncate text-sm text-ink-muted">
                {teachers.map((teacher) => t(teacher.name, locale)).join(", ")}
              </p>
              <p className="mt-1 text-sm font-semibold text-blue-strong">
                {t(course.price, locale)}
              </p>
            </div>
            <ArrowRight
              aria-hidden="true"
              className="h-5 w-5 text-blue transition group-hover:translate-x-1"
            />
          </div>
        </div>
      </Link>
    </Card>
  );
}
