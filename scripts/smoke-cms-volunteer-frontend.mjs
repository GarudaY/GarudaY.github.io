import assert from "node:assert/strict";
import { localCmsClient, frontendPage, fetchLocal, cms } from "./cms-local-test-client.mjs";
import { parseCmsVolunteer } from "../src/lib/cms-volunteer.ts";

const client = await localCmsClient("volunteer");
const current = parseCmsVolunteer(
  await (await fetchLocal(`${cms}/?rest_route=/sonnenblume/v1/volunteer/public`)).json(),
);
assert.deepEqual(
  new Set(current.map((item) => item.id)),
  new Set(["events", "media", "translation", "projects"]),
);
assert.ok((await frontendPage("/uk/join")).includes("Допомога на подіях"));
assert.ok((await frontendPage("/de/join")).includes("Mithilfe bei Veranstaltungen"));
console.log("PASS: four local volunteer tasks render in Ukrainian and German");

const marker = `CMS-VOLUNTEER-${Date.now()}`;
const data = {
  slug: marker.toLowerCase(),
  title: { uk: marker, de: marker + "-DE" },
  description: { uk: "Тестове волонтерське завдання.", de: "Lokale ehrenamtliche Testaufgabe." },
  time: { uk: "За домовленістю", de: "Nach Absprache" },
  location: { uk: "Мьонхенгладбах", de: "Mönchengladbach" },
  icon: "heart",
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
  assert.ok(!(await frontendPage("/uk/join")).includes(marker));
  console.log("PASS: volunteer draft remains private");
  await write("publish");
  assert.ok((await frontendPage("/uk/join")).includes(marker));
  assert.ok((await frontendPage("/de/join")).includes(marker + "-DE"));
  console.log("PASS: new volunteer task appears on both pages without rebuild");
  const changed = structuredClone(data);
  changed.title.uk = "UNPUBLISHED-" + marker;
  await write("save", changed);
  assert.ok(!(await frontendPage("/uk/join")).includes(changed.title.uk));
  console.log("PASS: working draft does not change the public volunteer card");
  await write("archive");
  assert.ok(!(await frontendPage("/uk/join")).includes(marker));
  assert.ok((await frontendPage("/uk/join")).includes("Маєте іншу ідею?"));
  console.log("PASS: withdrawn task disappears while own-idea form remains");
} finally {
  if (item && !item.archived) await write("archive");
  console.log("Local volunteer test archived; original tasks preserved.");
}
