import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { people } from "../src/content/mock/people.ts";
import { courses } from "../src/content/mock/courses.ts";
import { events } from "../src/content/mock/events.ts";
import { volunteerOpportunities } from "../src/content/mock/volunteer-opportunities.ts";
import { partners } from "../src/content/mock/partners.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = new URL(process.env.SNB_WP_URL ?? "");
const httpUser = process.env.SNB_HTTP_USER;
const httpPassword = process.env.SNB_HTTP_PASSWORD;
const wordpressUser = process.env.SNB_WP_USER;
const wordpressPassword = process.env.SNB_WP_PASSWORD;
if (
  base.protocol !== "https:" ||
  !httpUser ||
  !httpPassword ||
  !wordpressUser ||
  !wordpressPassword
) {
  throw new Error("Set HTTPS SNB_WP_URL and all SNB_HTTP_*/SNB_WP_* variables");
}

const basic = Buffer.from(`${httpUser}:${httpPassword}`, "utf8").toString("base64");
const cookies = new Map();
let nonce = "";
function collect(response) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  }
}
const cookieHeader = () =>
  [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
async function request(url, options = {}) {
  const target = new URL(url, base);
  if (target.protocol !== "https:" || target.origin !== base.origin)
    throw new Error("Content sync attempted to leave the configured WordPress origin");
  const response = await fetch(target, {
    ...options,
    headers: {
      Authorization: `Basic ${basic}`,
      Cookie: cookieHeader(),
      ...(nonce ? { "X-WP-Nonce": nonce } : {}),
      ...options.headers,
    },
    redirect: options.redirect ?? "follow",
    signal: AbortSignal.timeout(60_000),
  });
  collect(response);
  const nextNonce = response.headers.get("X-WP-Nonce");
  if (nextNonce) nonce = nextNonce;
  return response;
}
async function json(url, options = {}) {
  const response = await request(url, options);
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(`${new URL(url, base).pathname}: ${JSON.stringify(result)}`);
  return result;
}

await request("wp-login.php");
const login = await request("wp-login.php", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    log: wordpressUser,
    pwd: wordpressPassword,
    "wp-submit": "Log In",
    redirect_to: new URL(
      "wp-admin/admin.php?page=sonnenblume-content",
      base,
    ).toString(),
    testcookie: "1",
  }),
  redirect: "manual",
});
if (login.status !== 302) throw new Error(`WordPress login returned ${login.status}`);
const admin = await request("wp-admin/admin.php?page=sonnenblume-content");
const adminHtml = await admin.text();
const rawConfig = adminHtml.match(/window\.SNB_CONTENT\s*=\s*(\{[^\n]+\});/);
if (!rawConfig) throw new Error("Authenticated editor configuration is missing");
nonce = JSON.parse(rawConfig[1]).nonce;

const mediaCache = new Map();
function safeName(source) {
  return (
    "snb-" +
    path
      .basename(source)
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9._-]+/g, "-")
  );
}
async function media(asset) {
  if (!asset?.src) return 0;
  if (mediaCache.has(asset.src)) return mediaCache.get(asset.src);
  const source = path.join(root, "public", asset.src.replace(/^\//, ""));
  let filename = safeName(source);
  let contentType;
  let bytes;
  if (path.extname(source).toLowerCase() === ".svg") {
    filename = filename.replace(/\.svg$/i, ".png");
    contentType = "image/png";
    bytes = await sharp(source, { density: 240 }).png().toBuffer();
  } else {
    const extension = path.extname(source).toLowerCase();
    contentType = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".avif": "image/avif",
    }[extension];
    if (!contentType) throw new Error(`Unsupported media: ${source}`);
    bytes = await readFile(source);
  }
  const slug = path.basename(filename, path.extname(filename));
  const existing = await json(
    `wp-json/wp/v2/media?context=edit&slug=${encodeURIComponent(slug)}&per_page=1`,
  );
  let id = existing[0]?.id;
  if (!id) {
    const uploaded = await json("wp-json/wp/v2/media", {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
      body: bytes,
    });
    id = uploaded.id;
  }
  if (!Number.isInteger(id)) throw new Error(`Media upload failed: ${asset.src}`);
  mediaCache.set(asset.src, id);
  return id;
}
const localizedEmpty = () => ({ uk: "", de: "" });
const imageFields = async (asset) => ({
  imageId: await media(asset),
  imageAlt: asset?.alt ?? localizedEmpty(),
  imageFocus: asset?.focus ?? 50,
});

async function collection(name) {
  return json(`wp-json/sonnenblume/v1/${name}`);
}
function identity(name, data) {
  if (name === "updates") return (item) => item.data?.title?.uk === data.title.uk;
  return (item) => item.data?.slug === data.slug;
}
async function publish(name, data) {
  const listed = await collection(name);
  const current = listed.items.find(identity(name, data));
  const endpoint = `wp-json/sonnenblume/v1/${name}${current ? `/${current.id}` : ""}`;
  const result = await json(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "publish",
      ...(current ? { revision: current.revision } : {}),
      data,
    }),
  });
  process.stdout.write(`${name}: ${data.slug ?? data.title.uk}\n`);
  return result;
}

for (const [index, person] of people.entries()) {
  await publish("people", {
    slug: person.slug,
    name: person.name,
    roleLabel: person.roleLabel,
    bio: person.bio,
    teacherRoleLabel:
      person.teacherRoleLabel ??
      (person.roles.includes("teacher") ? person.roleLabel : localizedEmpty()),
    teacherBio:
      person.teacherBio ??
      (person.roles.includes("teacher") ? person.bio : localizedEmpty()),
    roles: person.roles,
    boardPosition: person.roles.includes("board")
      ? person.boardPosition ?? "member"
      : null,
    languages: person.languages ?? [],
    order: person.order ?? (index + 1) * 10,
    ...(await imageFields(person.image)),
    publicationPermission: true,
  });
}

async function courseData(course, relatedCourseIds) {
  return {
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    description: course.description,
    outcomes: course.outcomes,
    materials: course.materials,
    ageGroup: course.ageGroup,
    language: course.language,
    format: course.format,
    location: course.location,
    price: course.price,
    startsAt: course.startsAt ?? "",
    duration: course.duration,
    seatsTotal: course.seatsTotal ?? 0,
    seatsAvailable: course.seatsAvailable ?? 0,
    teacherIds: course.teacherIds ?? [],
    relatedCourseIds,
    schedule: course.schedule ?? [],
    category: course.category,
    enrollmentStatus: course.enrollmentStatus,
    isFeatured: Boolean(course.isFeatured),
    order: course.order ?? 10,
    ...(await imageFields(course.image)),
  };
}
for (const course of courses) await publish("courses", await courseData(course, []));
for (const course of courses)
  if (course.relatedCourseIds?.length)
    await publish(
      "courses",
      await courseData(course, course.relatedCourseIds),
    );

for (const [index, event] of events.entries()) {
  const gallery = [];
  for (const image of event.gallery ?? [])
    gallery.push({
      imageId: await media(image),
      imageAlt: image.alt,
      imageFocus: image.focus ?? 50,
    });
  await publish("events", {
    slug: event.slug,
    title: event.title,
    summary: event.summary,
    description: event.description,
    dateLabel: event.dateLabel ?? localizedEmpty(),
    timeLabel: event.timeLabel ?? localizedEmpty(),
    location: event.location,
    price: event.price,
    registrationLabel: event.registrationLabel,
    category: event.category,
    eventStatus: event.eventStatus,
    archiveType: event.archiveType ?? "",
    organizerName: event.organizerName ?? "",
    startsAt: event.startsAt,
    endsAt: event.endsAt ?? "",
    contactEmail: event.contactEmail,
    relatedCourseIds: event.relatedCourseIds ?? [],
    gallery,
    isFeatured: Boolean(event.isFeatured),
    capacity: event.capacity ?? 0,
    seatsAvailable: event.seatsAvailable ?? 0,
    order: event.order ?? (index + 1) * 10,
    ...(await imageFields(event.image)),
  });
}

for (const opportunity of volunteerOpportunities) {
  await publish("volunteer", {
    slug: opportunity.id,
    title: opportunity.title,
    description: opportunity.description,
    time: opportunity.time,
    location: opportunity.location,
    icon: opportunity.icon,
    order: opportunity.order,
  });
}

for (const [index, partner] of partners.entries()) {
  await publish("partners", {
    slug: partner.id.replace(/^partner-/, ""),
    kind: "organization",
    name: partner.name,
    description: partner.description,
    website: partner.website ?? "",
    publicationPermission: true,
    order: partner.order ?? (index + 1) * 10,
    ...(await imageFields(partner.logo)),
  });
}
await json("wp-json/sonnenblume/v1/partners/activate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});

const updates = JSON.parse(
  await readFile(path.join(root, "src/content/mock/verein-updates.json"), "utf8"),
);
for (const update of updates) {
  await publish("updates", {
    title: update.title,
    status: update.status,
    text: update.text,
    icon: update.icon,
    order: update.order,
    imageId: 0,
    imageAlt: localizedEmpty(),
    imageFocus: 50,
    isExample: Boolean(update.isExample),
  });
}

const counts = {};
for (const name of ["updates", "people", "courses", "events", "volunteer", "partners"]) {
  const feed = await json(`wp-json/sonnenblume/v1/${name}/public`);
  counts[name] = feed.items.length;
}
process.stdout.write(`${JSON.stringify({ ok: true, counts })}\n`);
