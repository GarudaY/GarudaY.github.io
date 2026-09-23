import { writeFile } from "node:fs/promises";
import { resolve, join, relative, isAbsolute } from "node:path";
import {
  wordpressNewsEndpoint,
  parseVereinUpdates,
} from "../src/lib/verein-updates.ts";
import { cmsPersonSchema, parseCmsPeople } from "../src/lib/cms-people.ts";
import { cmsCourseSchema, parseCmsCourses } from "../src/lib/cms-courses.ts";
import { cmsEventSchema, parseCmsEvents } from "../src/lib/cms-events.ts";
import { cmsVolunteerSchema, parseCmsVolunteer } from "../src/lib/cms-volunteer.ts";
import { cmsPartnerSchema, parseCmsPartners } from "../src/lib/cms-partners.ts";

const root = resolve(".");
const work = resolve(process.argv[2] || ".pages-work");
if (work !== join(root, ".pages-work"))
  throw new Error(
    "CMS snapshot can only be written to the generated Pages workspace",
  );
const output = join(work, "src", "content", "cms-static-snapshot.json");
const inside = relative(work, output);
if (inside.startsWith("..") || isAbsolute(inside))
  throw new Error("Invalid generated snapshot path");
const base = process.env.WORDPRESS_CMS_URL;
const cmsHttpUser = process.env.WORDPRESS_CMS_HTTP_USER;
const cmsHttpPassword = process.env.WORDPRESS_CMS_HTTP_PASSWORD;
if ((cmsHttpUser && !cmsHttpPassword) || (!cmsHttpUser && cmsHttpPassword)) {
  throw new Error(
    "Set both WORDPRESS_CMS_HTTP_USER and WORDPRESS_CMS_HTTP_PASSWORD, or neither",
  );
}
const cmsHeaders = { Accept: "application/json" };
if (cmsHttpUser && cmsHttpPassword) {
  cmsHeaders.Authorization = `Basic ${Buffer.from(
    `${cmsHttpUser}:${cmsHttpPassword}`,
    "utf8",
  ).toString("base64")}`;
}
let snapshot = {
  origin: null,
  news: null,
  people: null,
  courses: null,
  events: null,
  volunteer: null,
  partners: null,
};
if (base) {
  const endpoint = wordpressNewsEndpoint(base);
  const feed = async (collection) => {
    const url = new URL(endpoint);
    url.searchParams.set("rest_route", `/sonnenblume/v1/${collection}/public`);
    const response = await fetch(url, {
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: cmsHeaders,
    });
    if (
      !response.ok ||
      Number(response.headers.get("content-length")) > 2_000_000
    )
      throw new Error(`CMS ${collection} snapshot unavailable`);
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error("CMS snapshot too large");
    return JSON.parse(text);
  };
  const [news, people, courses, events, volunteer, partners] = await Promise.all([
    feed("updates"),
    feed("people"),
    feed("courses"),
    feed("events"),
    feed("volunteer"),
    feed("partners"),
  ]);
  const items = parseVereinUpdates(news, endpoint);
  parseCmsPeople(people, endpoint);
  parseCmsCourses(courses, endpoint);
  parseCmsEvents(events, endpoint);
  parseCmsVolunteer(volunteer);
  parseCmsPartners(partners, endpoint);
  snapshot = {
    origin: endpoint.origin + endpoint.pathname,
    news: { schemaVersion: 1, items },
    people: {
      schemaVersion: 1,
      items: cmsPersonSchema.array().parse(people.items),
    },
    courses: {
      schemaVersion: 1,
      items: cmsCourseSchema.array().parse(courses.items),
    },
    events: {
      schemaVersion: 1,
      items: cmsEventSchema.array().parse(events.items),
    },
    volunteer: {
      schemaVersion: 1,
      items: cmsVolunteerSchema.array().parse(volunteer.items),
    },
    partners: {
      schemaVersion: 1,
      initialized: partners.initialized,
      items: cmsPartnerSchema.array().parse(partners.items),
    },
  };
  console.log(
    `Captured one published CMS snapshot: ${snapshot.news.items.length} news, ${snapshot.people.items.length} profiles, ${snapshot.courses.items.length} courses, ${snapshot.events.items.length} events, ${snapshot.volunteer.items.length} volunteer tasks, ${snapshot.partners.items.length} partners. No credentials or drafts included.`,
  );
}
await writeFile(output, JSON.stringify(snapshot), "utf8");
