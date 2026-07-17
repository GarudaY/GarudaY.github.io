"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getPath, publicToInternalSegment } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import { t } from "@/lib/localize";
import type { NavigationItem } from "@/types/content";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SiteLogo } from "@/components/layout/SiteLogo";

type HeaderProps = {
  locale: Locale;
  navigation: NavigationItem[];
};

function isActive(pathname: string, locale: Locale, item: NavigationItem) {
  const segments = pathname.split("/").filter(Boolean);
  const current =
    publicToInternalSegment[locale][segments[1] ?? ""] ?? segments[1];
  return current === item.route;
}

export function Header({ locale, navigation }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const dict = getDictionary(locale);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <header className="header-glass sticky top-0 z-40 border-b border-border/70 bg-background/88 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <SiteLogo locale={locale} />
        <nav
          aria-label={locale === "uk" ? "Основна навігація" : "Hauptnavigation"}
          className="hidden items-center gap-1 lg:flex"
        >
          {navigation.map((item) => (
            <Link
              href={getPath(locale, item.route)}
              key={item.route}
              aria-current={
                isActive(pathname, locale, item) ? "page" : undefined
              }
              className={cn(
                "nav-pill focus-ring inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold leading-none",
                isActive(pathname, locale, item)
                  ? "bg-blue-strong text-white"
                  : "text-blue-strong hover:bg-surface-muted",
                item.route === "donate" &&
                  !isActive(pathname, locale, item) &&
                  "bg-yellow/35 hover:bg-yellow/55",
              )}
            >
              {t(item.label, locale)}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={locale} />
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-surface px-3 text-blue-strong lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
          <span className="ml-2 text-sm font-semibold">
            {open ? dict.nav.close : dict.nav.menu}
          </span>
        </button>
      </div>
      {open ? (
        <>
          <button
            type="button"
            tabIndex={-1}
            aria-label={dict.nav.close}
            className="mobile-menu-scrim fixed inset-x-0 bottom-0 top-20 z-40 bg-blue-strong/12 backdrop-blur-[2px] lg:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-navigation"
            className="mobile-menu-enter fixed inset-x-0 top-20 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-b-[24px] border-b border-border bg-background/96 px-4 pb-6 pt-2 shadow-[0_24px_60px_rgba(23,57,87,0.18)] backdrop-blur-xl lg:hidden"
          >
            <nav
              aria-label={
                locale === "uk" ? "Мобільна навігація" : "Mobile Navigation"
              }
              className="mx-auto grid max-w-7xl gap-2"
            >
              {navigation.map((item) => (
                <Link
                  href={getPath(locale, item.route)}
                  key={item.route}
                  aria-current={
                    isActive(pathname, locale, item) ? "page" : undefined
                  }
                  className={cn(
                    "nav-pill focus-ring flex min-h-12 items-center rounded-[14px] px-4 text-base font-semibold",
                    isActive(pathname, locale, item)
                      ? "bg-blue-strong text-white"
                      : "bg-surface text-blue-strong",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {t(item.label, locale)}
                </Link>
              ))}
              <div className="pt-3">
                <LanguageSwitcher locale={locale} />
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
