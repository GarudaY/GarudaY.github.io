import assert from "node:assert/strict";
import {
  localCmsClient,
  frontendPage,
  fetchLocal,
  cms,
} from "./cms-local-test-client.mjs";
import { parseCmsPeople } from "../src/lib/cms-people.ts";

const client = await localCmsClient("people");
const before = await fetchLocal(
  `${cms}/?rest_route=/sonnenblume/v1/people/public`,
);
const current = parseCmsPeople(await before.json(), new URL(cms));
assert.equal(
  current.find((person) => person.id === "person-natalia-petrova")
    .teacherRoleLabel.uk,
  "Викладачка німецької мови",
);
assert.equal(
  current.find((person) => person.id === "person-olga-zubchyk").teacherRoleLabel
    .uk,
  "Викладачка арифметики",
);
assert.equal(
  current.filter((person) => person.boardPosition === "chair").length,
  1,
);
for (const person of current.filter((person) => person.image))
  assert.equal((await fetchLocal(person.image.src)).status, 200);
console.log(
  "PASS: imported real portraits are accessible, board chair explicit, German/arithmetic assignments preserved",
);

const marker = `CMS-PEOPLE-${Date.now()}`;
const data = {
  slug: marker.toLowerCase(),
  name: { uk: marker, de: marker + "-DE" },
  roleLabel: { uk: "Локальний тестовий волонтер", de: "Lokale Testperson" },
  bio: {
    uk: "Тільки локальна технічна перевірка.",
    de: "Nur ein lokaler technischer Test.",
  },
  teacherRoleLabel: { uk: "", de: "" },
  teacherBio: { uk: "", de: "" },
  roles: ["volunteer"],
  boardPosition: null,
  languages: [],
  order: 0,
  imageId: 0,
  imageAlt: { uk: "", de: "" },
  imageFocus: 35,
  publicationPermission: true,
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
  assert.ok(!(await frontendPage("/uk")).includes(marker));
  await frontendPage(`/uk/people/${data.slug}`, 404);
  console.log("PASS: unpublished profile absent from home and detail route");
  await write("publish");
  assert.ok((await frontendPage("/uk")).includes(marker));
  assert.ok((await frontendPage("/de")).includes(marker + "-DE"));
  assert.ok((await frontendPage(`/uk/people/${data.slug}`)).includes(marker));
  assert.ok(
    (await frontendPage(`/de/people/${data.slug}`)).includes(marker + "-DE"),
  );
  console.log(
    "PASS: newly published volunteer appears on home and both new detail URLs without rebuild",
  );
  const changed = structuredClone(data);
  changed.name.uk = "UNPUBLISHED-" + marker;
  await write("save", changed);
  assert.ok(
    !(await frontendPage(`/uk/people/${data.slug}`)).includes(changed.name.uk),
  );
  assert.ok(!(await frontendPage("/uk")).includes(changed.name.uk));
  console.log(
    "PASS: working profile edits never leak into public home or details",
  );
  const teacher = structuredClone(data);
  teacher.roles = ["teacher"];
  teacher.teacherRoleLabel = {
    uk: "Тестова викладацька роль",
    de: "Test-Kursleitung",
  };
  teacher.teacherBio = {
    uk: "Тестовий викладацький опис",
    de: "Test-Kursbeschreibung",
  };
  await write("publish", teacher);
  assert.ok(!(await frontendPage("/uk")).includes(marker));
  const courses = await frontendPage("/uk/courses");
  assert.ok(courses.includes(`teacher-${data.slug}-title`));
  assert.ok(courses.includes("Тестова викладацька роль"));
  assert.ok((await frontendPage("/de/courses")).includes("Test-Kursleitung"));
  console.log(
    "PASS: role change moves person into the existing compact teacher layout in both languages",
  );
  await write("archive");
  assert.ok(!(await frontendPage("/uk/courses")).includes(marker));
  await frontendPage(`/uk/people/${data.slug}`, 404);
  assert.ok(!(await frontendPage("/sitemap.xml")).includes(data.slug));
  console.log(
    "PASS: withdrawal removes person from teachers, detail URL and sitemap",
  );
  const natalia = await frontendPage("/uk/courses/kurs-nimetskoi-movy");
  assert.ok(natalia.includes("Наталія Петрова"));
  console.log(
    "PASS: existing German course still resolves its original CMS-backed teacher",
  );
} finally {
  if (item && !item.archived) await write("archive");
  console.log(
    "Local profile test archived; editors' imported records and photos preserved.",
  );
}
