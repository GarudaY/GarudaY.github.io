import { publicCorsHeaders, publicCorsPreflight } from "@/server/public-cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WordPressPost = {
  id?: number;
  date?: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      alt_text?: string;
    }>;
  };
};

function decodeText(value: string | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/gu, " ")
    .replace(/&#(\d+);/gu, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([\da-f]+);/giu, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/\s+/gu, " ")
    .trim();
}

export function OPTIONS(request: Request) {
  return publicCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const source = new URL(
      "/wp-json/wp/v2/posts",
      process.env.WORDPRESS_PUBLIC_URL?.trim() || "https://sonnenblume-mg.com",
    );
    source.searchParams.set("per_page", "6");
    source.searchParams.set("_embed", "wp:featuredmedia");

    const response = await fetch(source, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`wordpress_http_${response.status}`);
    const posts = (await response.json()) as WordPressPost[];
    const items = posts
      .filter(
        (post) =>
          typeof post.id === "number" &&
          typeof post.link === "string" &&
          typeof post.date === "string",
      )
      .map((post) => {
        const media = post._embedded?.["wp:featuredmedia"]?.[0];
        return {
          id: post.id,
          title: decodeText(post.title?.rendered),
          excerpt: decodeText(post.excerpt?.rendered),
          publishedAt: post.date,
          href: post.link,
          image: media?.source_url,
          imageAlt:
            decodeText(media?.alt_text) || decodeText(post.title?.rendered),
        };
      });

    return Response.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300",
          ...publicCorsHeaders(request),
        },
      },
    );
  } catch (error) {
    console.error("WordPress news fetch failed", error);
    return Response.json(
      { code: "news_unavailable", items: [] },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
          ...publicCorsHeaders(request),
        },
      },
    );
  }
}
