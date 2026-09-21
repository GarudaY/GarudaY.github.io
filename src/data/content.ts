import { newsArticles } from "@/content/mock/news";
import { getPublishedPartners } from "@/server/cms-partners";
import { getPublishedPeople } from "@/server/cms-people";
import { getPublishedCourses } from "@/server/cms-courses";
import { getPublishedEvents } from "@/server/cms-events";
import {
  donationSettings,
  featuredContent,
  siteSettings,
} from "@/content/mock/site";
import type { Course, Event, NewsArticle, Person } from "@/types/content";

const published = <T extends { status: string }>(items: T[]) =>
  items.filter((item) => item.status === "published");

function resolveByIds<T extends { id: string }>(items: T[], ids: string[]) {
  return [...new Set(ids)]
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is T => Boolean(item));
}

export async function getSiteSettings() {
  return siteSettings;
}

export async function getNavigation() {
  return siteSettings.navigation;
}

export async function getFeaturedContent() {
  return featuredContent;
}

export async function getCourses() {
  return getPublishedCourses();
}

export async function getFeaturedCourses() {
  return (await getCourses()).filter((course) => course.isFeatured);
}

export async function getCourseBySlug(slug: string) {
  return (await getCourses()).find((course) => course.slug === slug);
}

export async function getRelatedCourses(course: Course) {
  const all = await getCourses();
  return all.filter((item) => course.relatedCourseIds.includes(item.id));
}

export async function getPeople() {
  return getPublishedPeople();
}

export async function getTeachers() {
  return (await getPeople()).filter((person) =>
    person.roles.includes("teacher"),
  );
}

export async function getPersonBySlug(slug: string) {
  return (await getPeople()).find((person) => person.slug === slug);
}

export async function getPeopleByIds(ids: string[]) {
  const all = await getPeople();
  return resolveByIds<Person>(all, ids);
}

export async function getCoursesByIds(ids: string[]) {
  const all = await getCourses();
  return resolveByIds<Course>(all, ids);
}

export async function getEvents() {
  return getPublishedEvents();
}

export async function getUpcomingEvents() {
  return (await getEvents()).filter(
    (event) => event.eventStatus === "upcoming",
  );
}

export async function getPastEvents() {
  return (await getEvents())
    .filter((event) => event.eventStatus === "past")
    .reverse();
}

export async function getCancelledEvents() {
  return (await getEvents()).filter(
    (event) => event.eventStatus === "cancelled",
  );
}

export async function getEventBySlug(slug: string) {
  return (await getEvents()).find((event) => event.slug === slug);
}

export async function getEventsByIds(ids: string[]) {
  const all = await getEvents();
  return resolveByIds<Event>(all, ids);
}

export async function getNewsArticles() {
  return published(newsArticles).sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export async function getFeaturedNews() {
  return (await getNewsArticles()).filter((article) => article.isFeatured);
}

export async function getNewsArticleBySlug(slug: string) {
  return (await getNewsArticles()).find((article) => article.slug === slug);
}

export async function getNewsByIds(ids: string[]) {
  const all = await getNewsArticles();
  return resolveByIds<NewsArticle>(all, ids);
}

export async function getPartners() {
  return getPublishedPartners();
}

export async function getDonationSettings() {
  return donationSettings;
}
