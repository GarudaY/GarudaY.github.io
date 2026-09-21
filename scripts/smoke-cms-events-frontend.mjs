import assert from "node:assert/strict";
import {
  localCmsClient,
  frontendPage,
  fetchLocal,
  cms,
  frontend,
} from "./cms-local-test-client.mjs";
import { parseCmsEvents } from "../src/lib/cms-events.ts";

const client = await localCmsClient("events");
const privateItems = (await client.api()).items;
assert.equal(privateItems.filter((item) => item.hasLive).length, 6);
const reusableImageId = privateItems.find((item) => item.data.imageId)?.data
  .imageId;
assert.ok(reusableImageId, "Imported event cover is unavailable");
const feed = await fetchLocal(
  `${cms}/?rest_route=/sonnenblume/v1/events/public`,
);
const current = parseCmsEvents(await feed.json(), new URL(cms));
assert.deepEqual(
  new Set(current.map((event) => event.id)),
  new Set([
    "event-adult-dance-2025",
    "event-healthcare-networking-2025",
    "event-independence-day-2026",
    "event-ai-volunteering-workshop-2026",
    "event-children-day-2025",
    "event-music-meeting-2025",
  ]),
);
for (const event of current) {
  assert.equal((await fetchLocal(event.image.src)).status, 200);
  for (const image of event.gallery)
    assert.equal((await fetchLocal(image.src)).status, 200);
}
assert.ok((await frontendPage("/uk/events")).includes("Музична зустріч"));
assert.ok(
  (await frontendPage("/uk/events/muzychna-zustrich-2025")).includes(
    "Музична зустріч",
  ),
);
console.log(
  "PASS: six existing events retain IDs, covers, gallery and archive links",
);

const marker = `CMS-EVENT-${Date.now()}`;
const data = {
  slug: marker.toLowerCase(),
  title: { uk: marker, de: marker + "-DE" },
  summary: {
    uk: "Локальна технічна перевірка події.",
    de: "Lokaler technischer Veranstaltungstest.",
  },
  description: {
    uk: "Ця подія використовується тільки для локальної перевірки.",
    de: "Diese Veranstaltung dient nur einem lokalen Test.",
  },
  dateLabel: { uk: "", de: "" },
  timeLabel: { uk: "", de: "" },
  location: { uk: "Mönchengladbach", de: "Mönchengladbach" },
  price: { uk: "Безкоштовно", de: "Kostenfrei" },
  registrationLabel: { uk: "Дізнатися більше", de: "Mehr erfahren" },
  category: "community",
  eventStatus: "upcoming",
  archiveType: "",
  organizerName: "",
  startsAt: "2026-10-18T15:00:00+02:00",
  endsAt: "2026-10-18T17:00:00+02:00",
  contactEmail: "kontakt@sonnenblume-mg.com",
  relatedCourseIds: [],
  gallery: [
    {
      imageId: reusableImageId,
      imageAlt: { uk: "Фото події", de: "Veranstaltungsfoto" },
      imageFocus: 50,
    },
  ],
  imageId: reusableImageId,
  imageAlt: { uk: "Афіша", de: "Veranstaltungsplakat" },
  imageFocus: 50,
  isFeatured: false,
  order: 99,
};
let item;
const write = async (action, value = data) => {
  item = await client.api(item ? `/${item.id}` : "", {
    action,
    revision: item?.revision,
    data: value,
  });
};

try {
  await write("save");
  assert.ok(!(await frontendPage("/uk/events")).includes(marker));
  await frontendPage(`/uk/events/${data.slug}`, 404);
  console.log("PASS: event draft stays absent from catalogue and detail URL");
  await write("publish");
  assert.ok((await frontendPage("/uk/events")).includes(marker));
  assert.ok((await frontendPage("/de/events")).includes(marker + "-DE"));
  assert.ok((await frontendPage(`/uk/events/${data.slug}`)).includes(marker));
  assert.ok(
    (await frontendPage(`/de/events/${data.slug}`)).includes(marker + "-DE"),
  );
  console.log("PASS: new event appears in both languages without rebuild");
  const availability = await fetchLocal(
    `${frontend}/api/registrations?event=${data.slug}`,
  );
  assert.equal(availability.status, 404);
  console.log("PASS: CMS event without registration capacity cannot accept signups");
  const changed = structuredClone(data);
  changed.title.uk = "UNPUBLISHED-" + marker;
  await write("save", changed);
  assert.ok(
    !(await frontendPage(`/uk/events/${data.slug}`)).includes(changed.title.uk),
  );
  console.log("PASS: event working draft does not replace the live page");
  const cancelled = structuredClone(data);
  cancelled.eventStatus = "cancelled";
  cancelled.description.uk = "Причину скасування повідомимо учасникам окремо.";
  cancelled.description.de = "Den Grund der Absage teilen wir separat mit.";
  await write("publish", cancelled);
  const cancelledPage = await frontendPage(`/uk/events/${data.slug}`);
  assert.ok(cancelledPage.includes("Подію скасовано"));
  assert.ok(cancelledPage.includes("Про скасування"));
  assert.ok(cancelledPage.includes("https://schema.org/EventCancelled"));
  assert.ok((await frontendPage("/uk/events")).includes(marker));
  console.log("PASS: cancelled event stays visible with cancellation notice and metadata");
  await write("archive");
  await frontendPage(`/uk/events/${data.slug}`, 404);
  assert.ok(!(await frontendPage("/sitemap.xml")).includes(data.slug));
  console.log("PASS: withdrawn event disappears from details and sitemap");
} finally {
  if (item && !item.archived) await write("archive");
  console.log("Local event test archived; imported events and media preserved.");
}
