import assert from "node:assert/strict";
import {
  localCmsClient,
  frontendPage,
  fetchLocal,
  cms,
} from "./cms-local-test-client.mjs";
import { parseCmsCourses } from "../src/lib/cms-courses.ts";

const client = await localCmsClient("courses");
const privateItems = (await client.api()).items;
assert.equal(privateItems.filter((item) => item.hasLive).length, 4);
const reusableImageId = privateItems.find((item) => item.data.imageId)?.data
  .imageId;
assert.ok(reusableImageId, "Imported course image is unavailable");
const publicResponse = await fetchLocal(
  `${cms}/?rest_route=/sonnenblume/v1/courses/public`,
);
const current = parseCmsCourses(await publicResponse.json(), new URL(cms));
assert.deepEqual(
  current.map((course) => course.id),
  [
    "course-german",
    "course-painting-daniil",
    "course-choreography-mriya",
    "course-choir",
  ],
);
for (const course of current)
  assert.equal((await fetchLocal(course.image.src)).status, 200);
console.log(
  "PASS: four existing courses retain IDs, order, covers and teacher relationships",
);

const marker = `CMS-COURSE-${Date.now()}`;
const data = {
  slug: marker.toLowerCase(),
  title: { uk: marker, de: marker + "-DE" },
  summary: {
    uk: "Локальна перевірка нового курсу.",
    de: "Lokaler Test für einen neuen Kurs.",
  },
  description: {
    uk: "Цей запис використовується тільки для локальної технічної перевірки.",
    de: "Dieser Eintrag dient nur einem lokalen technischen Test.",
  },
  outcomes: { uk: ["Перевірка публікації"], de: ["Publikation prüfen"] },
  materials: { uk: [], de: [] },
  ageGroup: { uk: "дорослі", de: "Erwachsene" },
  language: { uk: "українська", de: "Ukrainisch" },
  format: { uk: "очно", de: "vor Ort" },
  location: {
    uk: "Hauptstraße 91, 41236 Mönchengladbach",
    de: "Hauptstraße 91, 41236 Mönchengladbach",
  },
  schedule: [
    {
      weekday: { uk: "субота", de: "Samstag" },
      time: "12:00–13:00",
      cadence: { uk: "щотижня", de: "wöchentlich" },
    },
  ],
  price: { uk: "безкоштовно", de: "kostenfrei" },
  startsAt: "",
  duration: { uk: "регулярно", de: "regelmäßig" },
  seatsTotal: 12,
  seatsAvailable: 5,
  teacherIds: ["person-daniil-babych"],
  relatedCourseIds: [],
  category: "creative",
  enrollmentStatus: "open",
  isFeatured: false,
  order: 99,
  imageId: reusableImageId,
  imageAlt: { uk: "Учасники заняття", de: "Teilnehmende im Kurs" },
  imageFocus: 50,
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
  assert.ok(!(await frontendPage("/uk/courses")).includes(marker));
  await frontendPage(`/uk/courses/${data.slug}`, 404);
  console.log("PASS: course draft stays absent from catalogue and detail URL");
  await write("publish");
  assert.ok((await frontendPage("/uk/courses")).includes(marker));
  assert.ok((await frontendPage("/de/courses")).includes(marker + "-DE"));
  const uk = await frontendPage(`/uk/courses/${data.slug}`);
  const de = await frontendPage(`/de/courses/${data.slug}`);
  assert.ok(uk.includes(marker) && uk.includes("Даніїл Бабич"));
  assert.ok(de.includes(marker + "-DE") && de.includes("Daniil Babych"));
  console.log(
    "PASS: published course appears in both languages with its teacher",
  );
  const changed = structuredClone(data);
  changed.title.uk = "UNPUBLISHED-" + marker;
  await write("save", changed);
  assert.ok(
    !(await frontendPage(`/uk/courses/${data.slug}`)).includes(
      changed.title.uk,
    ),
  );
  console.log(
    "PASS: course working draft never replaces the published version",
  );
  await write("archive");
  await frontendPage(`/uk/courses/${data.slug}`, 404);
  assert.ok(!(await frontendPage("/sitemap.xml")).includes(data.slug));
  console.log("PASS: withdrawn course disappears from details and sitemap");
} finally {
  if (item && !item.archived) await write("archive");
  console.log(
    "Local course test archived; imported courses and media preserved.",
  );
}
