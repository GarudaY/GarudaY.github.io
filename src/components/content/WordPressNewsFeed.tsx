"use client";

import { ArrowUpRight, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import { apiUrl } from "@/lib/api-url";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type EditorialPost = {
  id: number;
  title: string;
  excerpt: string;
  publishedAt: string;
  href: string;
  image?: string;
  imageAlt: string;
};

function formatDate(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "de-DE", {
    dateStyle: "long",
  }).format(new Date(value));
}

export function WordPressNewsFeed({ locale }: { locale: Locale }) {
  const [posts, setPosts] = useState<EditorialPost[] | null>(null);
  const isUk = locale === "uk";

  useEffect(() => {
    const controller = new AbortController();
    fetch(apiUrl("/api/content/wordpress-news"), {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("news_unavailable");
        return (await response.json()) as { items?: EditorialPost[] };
      })
      .then((result) => setPosts(result.items ?? []))
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        setPosts([]);
      });
    return () => controller.abort();
  }, []);

  if (posts === null) {
    return (
      <div
        className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        aria-hidden="true"
      >
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-[390px] rounded-[18px]" />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="rounded-[18px] border border-border bg-surface p-6 text-ink-muted shadow-soft">
        {isUk
          ? "Стрічка новин тимчасово недоступна. Спробуйте оновити сторінку трохи пізніше."
          : "Der Nachrichten-Feed ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut."}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <Card key={post.id} className="group overflow-hidden">
          <a
            href={post.href}
            target="_blank"
            rel="noreferrer"
            className="focus-ring block h-full rounded-[18px]"
          >
            <div className="media-frame relative aspect-[16/9] overflow-hidden bg-surface-muted">
              {post.image ? (
                // WordPress owns and optimizes this public editorial image.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-blue">
                  <Newspaper aria-hidden="true" className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="grid gap-4 p-5">
              <p className="text-sm font-semibold text-blue">
                {formatDate(post.publishedAt, locale)}
              </p>
              <h2 className="text-xl font-bold leading-snug text-blue-strong group-hover:text-blue">
                {post.title}
              </h2>
              <p className="line-clamp-3 text-sm leading-6 text-ink-muted">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between border-t border-border pt-4 text-sm font-semibold text-blue-strong">
                <span>SONNENBLUME</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-5 w-5 text-blue transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                />
              </div>
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
}
