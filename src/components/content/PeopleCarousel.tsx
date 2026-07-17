"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getPath } from "@/i18n/routing";
import { t } from "@/lib/localize";
import type { Person } from "@/types/content";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ContentImage } from "@/components/ui/ContentImage";

type PeopleCarouselProps = {
  locale: Locale;
  people: Person[];
  title: string;
  description: string;
  preloadFirst?: boolean;
};

export function PeopleCarousel({
  locale,
  people,
  title,
  description,
  preloadFirst = false,
}: PeopleCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const [canMoveBack, setCanMoveBack] = useState(false);
  const [canMoveForward, setCanMoveForward] = useState(people.length > 1);

  const updateControls = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    setCanMoveBack(track.scrollLeft > 4);
    setCanMoveForward(track.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateControls();
    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    track.addEventListener("scroll", updateControls, { passive: true });

    return () => {
      observer.disconnect();
      track.removeEventListener("scroll", updateControls);
    };
  }, [updateControls]);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const distance = Math.max(track.clientWidth * 0.76, 280);
    const nextPosition =
      direction > 0
        ? Math.min(maxScroll, track.scrollLeft + distance)
        : Math.max(0, track.scrollLeft - distance);

    track.scrollTo({
      left: nextPosition,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <section aria-labelledby={headingId} className="min-w-0 max-w-full">
      <div className="flex items-end justify-between gap-5">
        <div className="max-w-2xl">
          <h2 id={headingId} className="text-3xl font-bold text-blue-strong">
            {title}
          </h2>
          <p className="mt-3 leading-7 text-ink-muted">{description}</p>
        </div>
        <div
          className="hidden shrink-0 gap-2 sm:flex"
          role="group"
          aria-label={
            locale === "uk" ? "Керування слайдером" : "Slider steuern"
          }
        >
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={!canMoveBack}
            className="carousel-control focus-ring inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-blue-strong shadow-sm hover:border-blue hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={
              locale === "uk" ? "Попередні профілі" : "Vorherige Profile"
            }
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={!canMoveForward}
            className="carousel-control focus-ring inline-flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-blue-strong shadow-sm hover:border-blue hover:bg-white disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={
              locale === "uk" ? "Наступні профілі" : "Nächste Profile"
            }
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={trackRef}
        className="carousel-track -mx-1 mt-6 flex w-full max-w-full snap-x snap-mandatory gap-5 overflow-x-auto px-1 pb-5"
      >
        {people.map((person) => (
          <Card
            key={person.id}
            className="group shrink-0 basis-[86%] snap-start overflow-hidden last:snap-end sm:basis-[56%] lg:basis-[42%] xl:basis-[38%]"
          >
            <Link
              href={getPath(locale, "people", person.slug)}
              className="focus-ring block h-full rounded-[18px]"
            >
              <ContentImage
                image={person.image}
                locale={locale}
                preload={preloadFirst && person.id === people[0]?.id}
                className="aspect-[4/3] rounded-none"
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 45vw, 86vw"
              />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap gap-2">
                  {person.isDemo ? <Badge tone="yellow">Demo</Badge> : null}
                  <Badge tone="blue">{t(person.roleLabel, locale)}</Badge>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-blue-strong transition-colors group-hover:text-blue">
                  {t(person.name, locale)}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-muted">
                  {t(person.bio, locale)}
                </p>
                <p className="mt-5 text-sm font-semibold text-blue">
                  {person.languages
                    .map((lang) => lang.toUpperCase())
                    .join(" / ")}
                </p>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      <p className="mt-1 text-center text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted sm:hidden">
        <span aria-hidden="true">↔ </span>
        {locale === "uk" ? "Гортайте профілі" : "Profile wischen"}
      </p>
    </section>
  );
}
