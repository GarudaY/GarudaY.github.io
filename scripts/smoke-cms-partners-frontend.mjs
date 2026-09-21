import assert from "node:assert/strict";
import { localCmsClient, frontendPage, fetchLocal, cms } from "./cms-local-test-client.mjs";
import { parseCmsPartners } from "../src/lib/cms-partners.ts";

const client = await localCmsClient("partners");
const endpoint = new URL(`${cms}/?rest_route=/sonnenblume/v1/partners/public`);
const feed = parseCmsPartners(await (await fetchLocal(endpoint)).json(), endpoint);
assert.ok(feed.initialized && feed.items.length >= 7, "Local partner collection must be imported and activated");
assert.ok((await frontendPage("/uk")).includes("Deutsche Stiftung für Engagement und Ehrenamt"));
assert.ok((await frontendPage("/de")).includes("Landesmusikrat NRW"));
console.log("PASS: existing organizations render from the activated CMS on both languages");

const marker = `CMS-PARTNER-${Date.now()}`;
const data = {
  slug: marker.toLowerCase(), kind: "person", name: marker,
  description: { uk: "Допомога команді.", de: "Unterstützung für das Team." },
  website: "", order: 99, imageId: 0, imageAlt: { uk: "", de: "" },
  imageFocus: 50, publicationPermission: true,
};
let item;
const write = async (action, value = data) => {
  item = await client.api(item ? `/${item.id}` : "", { action, revision: item?.revision, data: value });
};
try {
  await write("save");
  assert.ok(!(await frontendPage("/uk")).includes(marker));
  await write("publish");
  assert.ok((await frontendPage("/uk")).includes(marker));
  assert.ok((await frontendPage("/de")).includes("Unterstützung für das Team."));
  console.log("PASS: consented individual appears on both homepages without a rebuild");
  const changed = { ...data, name: "UNPUBLISHED-" + marker };
  await write("save", changed);
  assert.ok(!(await frontendPage("/uk")).includes(changed.name));
  await write("archive");
  assert.ok(!(await frontendPage("/uk")).includes(marker));
  assert.ok((await frontendPage("/uk")).includes("Deutsche Stiftung für Engagement und Ehrenamt"));
  console.log("PASS: draft stays private and withdrawal does not restore a removed record");
} finally {
  if (item && !item.archived) await write("archive");
}
