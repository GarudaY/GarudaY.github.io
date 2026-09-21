import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { localCmsClient } from "./cms-local-test-client.mjs";
import { partners } from "../src/content/mock/partners.ts";

// Isolated loopback preview only. Never import a historical list into a real CMS implicitly.
const client = await localCmsClient("partners");
const current = await client.api();
const known = new Set(current.items.map((item) => item.data.slug));
for (const partner of partners) {
  if (known.has(partner.id)) continue; // Preserve local editorial changes, including archived items.
  assert.ok(partner.logo?.src);
  const bytes = await readFile(new URL(`../public${partner.logo.src}`, import.meta.url));
  const svg = partner.logo.src.endsWith(".svg");
  const raster = svg ? await sharp(bytes).png().toBuffer() : bytes;
  const extension = svg ? "png" : partner.logo.src.split(".").at(-1);
  const mime = extension === "webp" ? "image/webp" : extension === "jpg" ? "image/jpeg" : "image/png";
  const imageId = await client.uploadImage(`${partner.id}.${extension}`, raster, mime);
  await client.api("", {
    action: "publish",
    data: {
      slug: partner.id, kind: "organization", name: partner.name,
      description: partner.description, website: partner.website || "", order: partner.order,
      imageId, imageAlt: partner.logo.alt, imageFocus: 50, publicationPermission: false,
    },
  });
  console.log(`Imported local partner: ${partner.name}`);
}
if (!current.initialized) {
  assert.equal((await client.api()).items.length, partners.length, "Review additional local records before activation");
  await client.api("/activate", {});
}
console.log("Local partner list is editable in WordPress; existing entries were not overwritten.");
