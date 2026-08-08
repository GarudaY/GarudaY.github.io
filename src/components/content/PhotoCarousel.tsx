"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { t } from "@/lib/localize";
import { cn } from "@/lib/cn";
import type { ImageAsset } from "@/types/content";

type PhotoCarouselProps = {
  images: ImageAsset[];
  locale: Locale;
  className?: string;
  interval?: number;
  preloadFirst?: boolean;
};

export function PhotoCarousel({
  images,
  locale,
  className,
  interval = 3000,
  preloadFirst = false,
}: PhotoCarouselProps) {
  const [active, setActive] = useState(0);
  const [manuallyPaused, setManuallyPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const labelId = useId();

  useEffect(() => {
    if (manuallyPaused || interacting || images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % images.length),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [images.length, interacting, interval, manuallyPaused]);

  if (!images.length) return null;

  const move = (direction: -1 | 1) => {
    setActive(
      (current) => (current + direction + images.length) % images.length,
    );
  };

  return (
    <div
      className={cn(
        "photo-carousel group relative isolate overflow-hidden rounded-[24px] bg-blue-strong shadow-soft",
        className,
      )}
      role="region"
      aria-roledescription={locale === "uk" ? "карусель" : "Karussell"}
      aria-labelledby={labelId}
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setInteracting(false);
      }}
    >
      <span id={labelId} className="sr-only">
        {locale === "uk" ? "Фотографії SONNENBLUME" : "Fotos von SONNENBLUME"}
      </span>
      {images.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={t(image.alt, locale)}
          fill
          preload={preloadFirst && index === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className={cn(
            "object-cover transition-[opacity,transform] duration-1000 ease-out",
            index === active
              ? "scale-100 opacity-100"
              : "pointer-events-none scale-[1.035] opacity-0",
          )}
          aria-hidden={index !== active}
        />
      ))}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-strong/35 via-transparent to-white/10" />

      {images.length > 1 ? (
        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3">
          <div className="flex rounded-full bg-blue-strong/72 p-1.5 backdrop-blur-md">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setActive(index)}
                className="focus-ring grid h-8 min-w-8 place-items-center rounded-full"
                aria-label={
                  locale === "uk"
                    ? `Показати фото ${index + 1}`
                    : `Foto ${index + 1} anzeigen`
                }
                aria-current={index === active ? "true" : undefined}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    index === active ? "w-5 bg-yellow" : "w-2.5 bg-white/65",
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-white/92 text-blue-strong shadow-sm transition hover:bg-white"
              aria-label={
                locale === "uk" ? "Попереднє фото" : "Vorheriges Foto"
              }
            >
              <ChevronLeft aria-hidden="true" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setManuallyPaused((value) => !value)}
              className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-white/92 text-blue-strong shadow-sm transition hover:bg-white"
              aria-label={
                manuallyPaused
                  ? locale === "uk"
                    ? "Продовжити автоматичну зміну"
                    : "Automatischen Wechsel fortsetzen"
                  : locale === "uk"
                    ? "Призупинити автоматичну зміну"
                    : "Automatischen Wechsel pausieren"
              }
            >
              {manuallyPaused ? (
                <Play aria-hidden="true" className="h-4 w-4" />
              ) : (
                <Pause aria-hidden="true" className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              className="focus-ring grid h-11 w-11 place-items-center rounded-full bg-white/92 text-blue-strong shadow-sm transition hover:bg-white"
              aria-label={locale === "uk" ? "Наступне фото" : "Nächstes Foto"}
            >
              <ChevronRight aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
