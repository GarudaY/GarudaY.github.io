import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { startWordPress } from "./wordpress-runtime.mjs";
import { PNG } from "pngjs";
import { parseCmsPeople } from "../src/lib/cms-people.ts";

const runtime = await startWordPress({ port: 9401 });
try {
  const code = await readFile(
    new URL("../cms/wordpress/tests/workflow.php", import.meta.url),
    "utf8",
  );
  const response = await runtime.playground.run({ code });
  assert.equal(response.exitCode, 0, response.errors);
  let result;
  try {
    result = JSON.parse(response.text);
  } catch {
    throw new Error(
      `PHP test did not return JSON: ${response.text} ${response.errors}`,
    );
  }
  if (result.error)
    throw new Error(
      `${result.error}; ${result.checks.length} checks completed`,
    );
  for (const check of result.checks) console.log(`PASS: ${check}`);
  const base = "http://127.0.0.1:9401";
  const request = async (
    path,
    { identity, body, nonce = identity?.nonce } = {},
  ) => {
    const response = await fetch(
      `${base}/?rest_route=/sonnenblume/v1/${path}`,
      {
        method: body ? "POST" : "GET",
        headers: {
          ...(identity ? { Cookie: identity.cookie } : {}),
          ...(nonce ? { "X-WP-Nonce": nonce } : {}),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(45000),
      },
    );
    return { status: response.status, data: await response.json() };
  };
  assert.equal((await request("updates")).status, 401);
  assert.equal(
    (await request("updates", { identity: result.subscriber })).status,
    403,
  );
  assert.equal(
    (await request("updates", { identity: result.author })).status,
    200,
  );
  console.log("PASS: native cookie + REST nonce authentication over real HTTP");
  assert.equal(
    (
      await request("updates", {
        identity: result.author,
        nonce: "invalid",
        body: { data: result.data },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await request("updates", {
        identity: result.author,
        nonce: null,
        body: { data: result.data },
      })
    ).status,
    401,
  );
  console.log("PASS: wrong/missing CSRF nonce rejected over HTTP");
  const raceData = structuredClone(result.data);
  raceData.title.uk = "Parallel draft";
  const races = await Promise.all(
    [1, 2].map(() =>
      request(`updates/${result.liveId}`, {
        identity: result.editor,
        body: { action: "save", revision: result.liveRevision, data: raceData },
      }),
    ),
  );
  assert.deepEqual(races.map((item) => item.status).sort(), [200, 409]);
  console.log("PASS: concurrent HTTP saves yield one success and one conflict");
  const publicFeed = await request("updates/public");
  assert.equal(publicFeed.status, 200);
  assert.equal(publicFeed.data.items[0].title.uk, result.data.title.uk);
  console.log("PASS: concurrent draft writes do not alter live news");
  const admin = await fetch(
    `${base}/wp-admin/admin.php?page=sonnenblume-content`,
    {
      headers: { Cookie: result.editor.cookie },
      redirect: "manual",
      signal: AbortSignal.timeout(45000),
    },
  );
  assert.equal(admin.status, 200);
  const adminHtml = await admin.text();
  assert.match(adminHtml, /id="snb-app"/);
  assert.match(adminHtml, /sonnenblume-content\/admin\.js/);
  assert.match(adminHtml, /window\.SNB_CONTENT/);
  console.log(
    "PASS: authenticated WordPress admin renders editor and its assets",
  );
  const fixture = new PNG({ width: 96, height: 64 });
  fixture.data.fill(210);
  const upload = await fetch(`${base}/?rest_route=/wp/v2/media`, {
    method: "POST",
    headers: {
      Cookie: result.author.cookie,
      "X-WP-Nonce": result.author.nonce,
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="snb-test.png"',
    },
    body: PNG.sync.write(fixture),
    signal: AbortSignal.timeout(45000),
  });
  const attachment = await upload.json();
  assert.equal(upload.status, 201, JSON.stringify(attachment));
  assert.equal(attachment.mime_type, "image/png");
  console.log(
    "PASS: author uploads actual raster file through native WordPress media REST API",
  );
  const imageData = structuredClone(result.data);
  imageData.imageId = attachment.id;
  const foreignMedia = await request("updates", {
    identity: result.other,
    body: { action: "save", data: imageData },
  });
  assert.equal(foreignMedia.status, 403);
  console.log("PASS: another author cannot attach somebody else's upload");
  const incompleteAlt = await request("updates", {
    identity: result.editor,
    body: { action: "publish", data: imageData },
  });
  assert.equal(incompleteAlt.status, 400);
  imageData.imageAlt = { uk: "Тестове фото", de: "Testfoto" };
  const withImage = await request("updates", {
    identity: result.author,
    body: { action: "save", data: imageData },
  });
  assert.equal(withImage.status, 201);
  const imagePublished = await request(`updates/${withImage.data.id}`, {
    identity: result.editor,
    body: {
      action: "publish",
      revision: withImage.data.revision,
      data: imageData,
    },
  });
  assert.equal(imagePublished.status, 200);
  const feedWithImage = (await request("updates/public")).data.items.find(
    (item) => item.id === withImage.data.id,
  );
  assert.equal(feedWithImage.image.alt.de, "Testfoto");
  assert.equal(
    (
      await fetch(feedWithImage.image.url, {
        signal: AbortSignal.timeout(45000),
      })
    ).status,
    200,
  );
  console.log(
    "PASS: photo publication requires bilingual alt and serves an accessible actual image URL",
  );
  const deleteMedia = await fetch(
    `${base}/?rest_route=/wp/v2/media/${attachment.id}&force=true`,
    {
      method: "DELETE",
      headers: {
        Cookie: result.editor.cookie,
        "X-WP-Nonce": result.editor.nonce,
      },
      signal: AbortSignal.timeout(45000),
    },
  );
  assert.equal(deleteMedia.status, 403);
  console.log("PASS: editor cannot delete shared photo through core media API");
  const peopleAdmin = await fetch(
    `${base}/wp-admin/admin.php?page=sonnenblume-people`,
    {
      headers: { Cookie: result.editor.cookie },
      redirect: "manual",
      signal: AbortSignal.timeout(45000),
    },
  );
  assert.equal(peopleAdmin.status, 200);
  const peopleHtml = await peopleAdmin.text();
  assert.match(peopleHtml, /id="snb-app"/);
  assert.match(peopleHtml, /sonnenblume-content\/admin\.js/);
  assert.match(peopleHtml, /"collection":"people"/);
  console.log(
    "PASS: native people admin serves the actual people form configuration and assets",
  );
  assert.equal((await request("people")).status, 401);
  assert.equal(
    (await request("people", { identity: result.subscriber })).status,
    403,
  );
  console.log("PASS: people cookie/nonce authorization is enforced over HTTP");
  const person = {
    slug: "http-person",
    name: { uk: "HTTP тест", de: "HTTP Test" },
    roleLabel: { uk: "Волонтер", de: "Ehrenamt" },
    bio: { uk: "Опис", de: "Beschreibung" },
    teacherRoleLabel: { uk: "", de: "" },
    teacherBio: { uk: "", de: "" },
    roles: ["volunteer"],
    boardPosition: null,
    languages: [],
    order: 10,
    imageId: attachment.id,
    imageAlt: { uk: "Тестове фото", de: "Testfoto" },
    imageFocus: 22,
    publicationPermission: true,
  };
  assert.equal(
    (
      await request("people", {
        identity: result.other,
        body: { action: "save", data: person },
      })
    ).status,
    403,
  );
  console.log(
    "PASS: people author cannot attach another author's photo over HTTP",
  );
  const createdPerson = await request("people", {
    identity: result.author,
    body: { action: "save", data: person },
  });
  assert.equal(createdPerson.status, 201);
  const publishedPerson = await request(`people/${createdPerson.data.id}`, {
    identity: result.editor,
    body: { action: "publish", revision: 1, data: person },
  });
  assert.equal(publishedPerson.status, 200);
  const publicPerson = (await request("people/public")).data.items.find(
    (item) => item.id === "person-http-person",
  );
  parseCmsPeople((await request("people/public")).data, new URL(base));
  assert.equal(publicPerson.image.focus, 22);
  assert.equal(publicPerson.image.alt.de, "Testfoto");
  assert.equal(
    (
      await fetch(publicPerson.image.url, {
        signal: AbortSignal.timeout(45000),
      })
    ).status,
    200,
  );
  console.log(
    "PASS: profile photo, translated alt and crop survive real publication and HTTP delivery",
  );
  const personRaces = await Promise.all(
    [1, 2].map(() =>
      request(`people/${createdPerson.data.id}`, {
        identity: result.editor,
        body: { action: "save", revision: 2, data: person },
      }),
    ),
  );
  assert.deepEqual(personRaces.map((item) => item.status).sort(), [200, 409]);
  console.log(
    "PASS: concurrent profile writes retain one winner and reject the other",
  );
  for (let round = 0; round < 5; round++) {
    const duplicateData = {
      ...person,
      slug: `concurrent-new-profile-${round}`,
    };
    const slugRaces = await Promise.all(
      [1, 2].map(() =>
        request("people", {
          identity: result.editor,
          body: { action: "save", data: duplicateData },
        }),
      ),
    );
    assert.deepEqual(slugRaces.map((item) => item.status).sort(), [201, 409]);
    const records = (await request("people", { identity: result.editor })).data
      .items;
    assert.equal(
      records.filter((item) => item.data.slug === duplicateData.slug).length,
      1,
    );
  }
  console.log(
    "PASS: simultaneous new profiles cannot reserve the same public URL",
  );
  console.log(
    `WordPress integration: ${result.checks.length + 15} checks passed. Isolated test runtime removed.`,
  );
} finally {
  await runtime[Symbol.asyncDispose]();
}
