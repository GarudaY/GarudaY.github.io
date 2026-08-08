import type { NewsArticle } from "@/types/content";

// Announcements are maintained in the organization's existing WordPress feed.
// Keeping this collection empty prevents the website from showing invented news.
export const newsArticles: NewsArticle[] = [];
