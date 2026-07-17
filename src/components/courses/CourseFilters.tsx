"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Course, Person } from "@/types/content";
import { t } from "@/lib/localize";
import { CourseCard } from "@/components/content/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";

const categoryLabels = {
  all: { uk: "Усі", de: "Alle" },
  language: { uk: "Мова", de: "Sprache" },
  children: { uk: "Діти", de: "Kinder" },
  culture: { uk: "Культура", de: "Kultur" },
  integration: { uk: "Інтеграція", de: "Integration" },
  creative: { uk: "Творчість", de: "Kreativ" },
};

export function CourseFilters({
  courses,
  teachers,
  locale,
}: {
  courses: Course[];
  teachers: Person[];
  locale: Locale;
}) {
  const [category, setCategory] = useState<keyof typeof categoryLabels>("all");
  const [openOnly, setOpenOnly] = useState(false);
  const availableCategories = useMemo(
    () =>
      (Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).filter(
        (key) =>
          key === "all" || courses.some((course) => course.category === key),
      ),
    [courses],
  );

  const filtered = useMemo(
    () =>
      courses.filter((course) => {
        const categoryMatch =
          category === "all" || course.category === category;
        const statusMatch = !openOnly || course.enrollmentStatus === "open";
        return categoryMatch && statusMatch;
      }),
    [category, courses, openOnly],
  );

  return (
    <div className="grid gap-8">
      <div className="form-panel flex flex-col gap-4 rounded-[18px] border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-blue-strong">
            {locale === "uk" ? "Категорія" : "Kategorie"}
          </legend>
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((key) => (
              <button
                type="button"
                key={key}
                className={`focus-ring min-h-11 rounded-full px-4 text-sm font-semibold ${
                  category === key
                    ? "bg-blue-strong text-white"
                    : "bg-surface-muted text-blue-strong hover:bg-yellow/30"
                }`}
                aria-pressed={category === key}
                onClick={() => setCategory(key)}
              >
                {categoryLabels[key][locale]}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="flex min-h-11 items-center gap-3 rounded-full bg-surface-muted px-4 text-sm font-semibold text-blue-strong">
          <input
            type="checkbox"
            className="h-5 w-5 shrink-0 accent-blue"
            checked={openOnly}
            onChange={(event) => setOpenOnly(event.target.checked)}
          />
          {locale === "uk" ? "Тільки відкритий набір" : "Nur offene Anmeldung"}
        </label>
      </div>
      {filtered.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              locale={locale}
              teachers={teachers.filter((teacher) =>
                course.teacherIds.includes(teacher.id),
              )}
              eager={index < 3}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          locale={locale}
          title={
            locale === "uk"
              ? "За цими фільтрами курсів немає"
              : "Keine Kurse für diese Filter"
          }
          body={t(
            {
              uk: "Спробуйте змінити категорію або вимкнути фільтр набору.",
              de: "Ändern Sie die Kategorie oder deaktivieren Sie den Anmeldefilter.",
            },
            locale,
          )}
        />
      )}
    </div>
  );
}
