import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

// Unit tests for the shipped editor logic, not a substitute for browser/layout QA.
class Node {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = {};
    this.style = {};
    this._text = "";
    this.className = "";
  }
  append(...nodes) {
    for (const node of nodes) {
      node.parentElement = this;
      this.children.push(node);
    }
  }
  replaceChildren(...nodes) {
    this.children = [];
    this._text = "";
    this.append(...nodes);
  }
  set textContent(value) {
    this._text = String(value);
    this.children = [];
  }
  get textContent() {
    return this._text + this.children.map((node) => node.textContent).join("");
  }
  setAttribute(key, value) {
    this.attributes[key] = String(value);
  }
  removeAttribute(key) {
    delete this.attributes[key];
    delete this[key];
  }
  get classList() {
    return {
      toggle: (name, enabled) => {
        const values = new Set(this.className.split(" ").filter(Boolean));
        if (enabled) values.add(name);
        else values.delete(name);
        this.className = [...values].join(" ");
      },
    };
  }
  addEventListener(event, handler) {
    this.listeners[event] = handler;
  }
  querySelectorAll(selector) {
    const tags = selector.split(",");
    return this.children.flatMap((node) => [
      ...(tags.includes(node.tag) ? [node] : []),
      ...node.querySelectorAll(selector),
    ]);
  }
  async click() {
    if (!this.disabled) return this.listeners.click?.();
  }
  input(value) {
    this.value = value;
    this.listeners.input?.({});
  }
  change(value) {
    this.checked = value;
    this.listeners.change?.({});
  }
}
const code = await readFile(
  new URL("../cms/wordpress/sonnenblume-content/admin.js", import.meta.url),
  "utf8",
);
const courseCode = await readFile(
  new URL(
    "../cms/wordpress/sonnenblume-content/courses-admin.js",
    import.meta.url,
  ),
  "utf8",
);
const eventCode = await readFile(
  new URL(
    "../cms/wordpress/sonnenblume-content/events-admin.js",
    import.meta.url,
  ),
  "utf8",
);
const volunteerCode = await readFile(
  new URL("../cms/wordpress/sonnenblume-content/volunteer-admin.js", import.meta.url),
  "utf8",
);
const partnerCode = await readFile(
  new URL("../cms/wordpress/sonnenblume-content/partners-admin.js", import.meta.url),
  "utf8",
);
const tick = () => new Promise((done) => setImmediate(done));
async function app(canPublish = true, collection = "updates") {
  const root = new Node("div");
  const records = new Map();
  const requests = [];
  let failure = null;
  let pending = null;
  const mediaHandlers = {};
  let selection = null;
  const media = () => ({
    on: (name, callback) => {
      mediaHandlers[name] = callback;
    },
    open() {},
    state: () => ({
      get: () => ({ first: () => ({ toJSON: () => selection }) }),
    }),
  });
  media.attachment = () => ({
    fetch: async () => ({
      url: "https://cms.example.org/wp-content/uploads/test.png",
    }),
  });
  const fetcher = async (url, options) => {
    if (options.method === "POST" && pending) await pending;
    const path = new URL(url).searchParams.get("rest_route");
    const id = Number(path.split("/").pop());
    const body = options.body ? JSON.parse(options.body) : null;
    requests.push({ path, body, headers: options.headers });
    let value;
    if (body && failure)
      return {
        status: failure.status,
        ok: false,
        headers: { get: () => null },
        json: async () => failure,
      };
    if (!body) value = id ? records.get(id) : { items: [...records.values()] };
    else {
      const old = records.get(id);
      const live =
        body.action === "publish"
          ? body.data
          : body.action === "archive"
            ? null
            : old?.live || null;
      value = {
        id: id || records.size + 1,
        authorName: "Автор",
        revision: (old?.revision || 0) + 1,
        data: body.data,
        live,
        hasLive: Boolean(live),
        archived: body.action === "archive",
        hasChanges: JSON.stringify(live) !== JSON.stringify(body.data),
        workflow:
          body.action === "submit"
            ? "review"
            : body.action === "publish"
              ? "published"
              : "draft",
        history: [],
        canPublish,
      };
      records.set(value.id, structuredClone(value));
    }
    return {
      status: body ? 201 : 200,
      ok: true,
      headers: { get: () => "refreshed-nonce" },
      json: async () => structuredClone(value),
    };
  };
  vm.runInNewContext(
    collection === "courses"
      ? courseCode
      : collection === "events"
        ? eventCode
        : collection === "volunteer"
          ? volunteerCode
          : collection === "partners"
            ? partnerCode
        : code,
    {
      document: {
        getElementById: () => root,
        createElement: (tag) => new Node(tag),
      },
      window: {
        location: {
          href: `https://cms.example.org/wp-admin/admin.php?page=sonnenblume-${["people", "courses", "events", "volunteer", "partners"].includes(collection) ? collection : "content"}`,
        },
        SNB_CONTENT: {
          api: `https://cms.example.org/?rest_route=/sonnenblume/v1/${collection}`,
          collection,
          nonce: "initial-nonce",
          canPublish,
          userName: "Автор",
          teacherOptions:
            collection === "courses"
              ? [
                  {
                    id: "person-teacher",
                    name: { uk: "Викладач", de: "Kursleitung" },
                  },
                ]
              : [],
          courseOptions:
            collection === "events"
              ? [
                  {
                    id: "course-german",
                    title: { uk: "Німецька мова", de: "Deutsch" },
                  },
                ]
              : [],
        },
        confirm: () => true,
        addEventListener() {},
      },
      wp: { media },
      fetch: fetcher,
      URL,
      AbortSignal,
      structuredClone,
      Date,
      Number,
      String,
      Error,
      JSON,
    },
  );
  await tick();
  return {
    root,
    records,
    requests,
    button: (text) =>
      root.querySelectorAll("button").find((node) => node.textContent === text),
    field: (name) =>
      root
        .querySelectorAll("input,textarea")
        .find((node) => node.id === `snb-${name}`),
    fail: (value) => {
      failure = value;
    },
    block: (value) => {
      pending = value;
    },
    choose: (value) => {
      selection = value;
      mediaHandlers.select();
    },
  };
}
test("language tabs preserve both translations and the preview uses the selected language", async () => {
  const editor = await app();
  editor.field("title").input("Український заголовок");
  await editor.button("Deutsch").click();
  editor.field("title").input("Deutscher Titel");
  assert.ok(editor.root.textContent.includes("Deutscher Titel"));
  await editor.button("Українська").click();
  assert.equal(editor.field("title").value, "Український заголовок");
  await editor.button("Зберегти чернетку").click();
  const body = editor.requests.find((item) => item.body).body;
  assert.equal(body.data.title.uk, "Український заголовок");
  assert.equal(body.data.title.de, "Deutscher Titel");
  assert.equal(body.action, "save");
});
test("save prevents double clicks and uses refreshed WordPress nonce", async () => {
  const editor = await app();
  editor.field("title").input("Новина");
  let release;
  editor.block(
    new Promise((done) => {
      release = done;
    }),
  );
  const save = editor.button("Зберегти чернетку");
  const saving = save.click();
  assert.equal(save.disabled, true);
  await save.click();
  release();
  await saving;
  const writes = editor.requests.filter((item) => item.body);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].headers["X-WP-Nonce"], "refreshed-nonce");
});
test("conflict and refresh retain unsaved text", async () => {
  const editor = await app();
  editor.field("title").input("Мій незбережений текст");
  editor.fail({ status: 409, message: "Конфлікт правок" });
  await editor.button("Зберегти чернетку").click();
  assert.equal(editor.field("title").value, "Мій незбережений текст");
  assert.ok(editor.root.textContent.includes("Конфлікт правок"));
  editor.fail(null);
  await editor.button("Оновити список").click();
  assert.equal(editor.field("title").value, "Мій незбережений текст");
});
test("author does not get publication or archive controls", async () => {
  const editor = await app(false);
  assert.equal(editor.button("Опублікувати"), undefined);
  assert.equal(editor.button("Зняти з публікації"), undefined);
  assert.ok(editor.button("На перевірку"));
});
test("safe photo selection, alt and crop are included in the write; removal is explicit", async () => {
  const editor = await app();
  editor.field("title").input("Новина з фото");
  await editor.button("Обрати / завантажити фото").click();
  editor.choose({
    id: 15,
    mime: "image/png",
    url: "https://cms.example.org/wp-content/uploads/test.png",
  });
  editor.field("imageAlt").input("Учасники майстерні");
  await editor.button("Зберегти чернетку").click();
  assert.equal(editor.requests.find((item) => item.body).body.data.imageId, 15);
  assert.equal(
    editor.requests.find((item) => item.body).body.data.imageAlt.uk,
    "Учасники майстерні",
  );
  await editor.button("Прибрати фото").click();
  await editor.button("Зберегти чернетку").click();
  assert.equal(
    editor.requests.filter((item) => item.body).at(-1).body.data.imageId,
    0,
  );
});
test("preview treats user input as text, not HTML", async () => {
  const editor = await app();
  editor.field("title").input('<img src=x onerror="alert(1)">');
  assert.ok(editor.root.textContent.includes('<img src=x onerror="alert(1)">'));
  assert.equal(editor.root.querySelectorAll("img").length, 1);
});
test("archived records are hidden from active list and remain reachable in archive", async () => {
  const editor = await app();
  editor.field("title").input("Архівна новина");
  await editor.button("Опублікувати").click();
  await editor.button("Зняти з публікації").click();
  await tick();
  const list = editor.root.children
    .find((node) => node.className === "snb-layout")
    .children[0].children.at(-1);
  assert.ok(!list.textContent.includes("Архівна новина"));
  await editor.button("Архів").click();
  assert.ok(list.textContent.includes("Архівна новина"));
});
test("people editor keeps translations, defaults to volunteer, and locks saved profile address", async () => {
  const editor = await app(true, "people");
  editor.field("name").input("Тестовий волонтер");
  editor.field("slug").input("fixture-volunteer");
  await editor.button("Deutsch").click();
  editor.field("name").input("Testperson");
  editor.field("publicationPermission").change(true);
  await editor.button("Зберегти чернетку").click();
  const write = editor.requests.find((item) => item.body);
  assert.equal(write.path, "/sonnenblume/v1/people");
  assert.deepEqual(write.body.data.roles, ["volunteer"]);
  assert.equal(write.body.data.name.uk, "Тестовий волонтер");
  assert.equal(write.body.data.name.de, "Testperson");
  assert.equal(write.body.data.publicationPermission, true);
  assert.equal(editor.field("slug").readOnly, true);
});
test("people board position is explicit and unrelated to the person's name", async () => {
  const editor = await app(true, "people");
  editor.field("role-board").change(true);
  await editor.button("Зберегти чернетку").click();
  const data = editor.requests.find((item) => item.body).body.data;
  assert.ok(data.roles.includes("board"));
  assert.equal(data.boardPosition, "member");
  editor.field("role-board").change(false);
  await editor.button("Зберегти чернетку").click();
  assert.equal(
    editor.requests.filter((item) => item.body).at(-1).body.data.boardPosition,
    null,
  );
});

test("course editor preserves translations, schedule and stable address", async () => {
  const editor = await app(true, "courses");
  editor.field("title").input("Мовний клуб");
  editor.field("slug").input("movnyi-klub");
  editor.field("outcomes").input("Розмовна практика\nНові знайомства");
  editor.field("schedule").input("середа | 18:00–19:00 | щотижня");
  await editor.button("Deutsch").click();
  editor.field("title").input("Sprachclub");
  editor.field("outcomes").input("Sprechpraxis\nNeue Kontakte");
  editor.field("schedule").input("Mittwoch | 18:00–19:00 | wöchentlich");
  await editor.button("Зберегти чернетку").click();
  const write = editor.requests.find((item) => item.body);
  assert.equal(write.path, "/sonnenblume/v1/courses");
  assert.equal(write.body.data.title.uk, "Мовний клуб");
  assert.equal(write.body.data.title.de, "Sprachclub");
  assert.deepEqual(write.body.data.outcomes.uk, [
    "Розмовна практика",
    "Нові знайомства",
  ]);
  assert.equal(write.body.data.schedule[0].weekday.uk, "середа");
  assert.equal(write.body.data.schedule[0].weekday.de, "Mittwoch");
  assert.equal(editor.field("slug").readOnly, true);
});

test("course author can submit drafts but cannot publish or withdraw", async () => {
  const editor = await app(false, "courses");
  assert.ok(editor.button("На перевірку"));
  assert.equal(editor.button("Опублікувати"), undefined);
  assert.equal(editor.button("Зняти з публікації"), undefined);
});

test("event editor preserves both languages and keeps capacity outside content CMS", async () => {
  const editor = await app(true, "events");
  editor.field("title").input("Осіння зустріч");
  editor.field("slug").input("osinnia-zustrich-2026");
  editor.field("startsAt").input("2026-10-18T15:00:00+02:00");
  await editor.button("Deutsch").click();
  editor.field("title").input("Herbsttreffen");
  await editor.button("Зберегти чернетку").click();
  const write = editor.requests.find((item) => item.body);
  assert.equal(write.path, "/sonnenblume/v1/events");
  assert.equal(write.body.data.title.uk, "Осіння зустріч");
  assert.equal(write.body.data.title.de, "Herbsttreffen");
  assert.equal(write.body.data.capacity, undefined);
  assert.equal(write.body.data.seatsAvailable, undefined);
  assert.equal(editor.field("slug").readOnly, true);
});

test("event author can submit drafts but cannot publish or withdraw", async () => {
  const editor = await app(false, "events");
  assert.ok(editor.button("На перевірку"));
  assert.equal(editor.button("Опублікувати"), undefined);
  assert.equal(editor.button("Зняти з публікації"), undefined);
});

test("volunteer editor preserves translations and stable form context", async () => {
  const editor = await app(true, "volunteer");
  editor.field("title").input("Помічник події");
  editor.field("slug").input("event-helper");
  editor.field("description").input("Зустрічати гостей.");
  await editor.button("Deutsch").click();
  editor.field("title").input("Veranstaltungshelfer");
  editor.field("description").input("Gäste begrüßen.");
  await editor.button("Зберегти чернетку").click();
  const write = editor.requests.find((item) => item.body);
  assert.equal(write.path, "/sonnenblume/v1/volunteer");
  assert.equal(write.body.data.slug, "event-helper");
  assert.equal(write.body.data.title.uk, "Помічник події");
  assert.equal(write.body.data.title.de, "Veranstaltungshelfer");
  assert.equal(editor.field("slug").readOnly, true);
});

test("volunteer author can submit but not publish or withdraw", async () => {
  const editor = await app(false, "volunteer");
  assert.ok(editor.button("На перевірку"));
  assert.equal(editor.button("Опублікувати"), undefined);
  assert.equal(editor.button("Зняти з публікації"), undefined);
});

test("partner editor preserves bilingual thanks, selected media and consent", async () => {
  const editor = await app(true, "partners");
  editor.field("name").input("Тестовий партнер");
  editor.field("slug").input("test-helper");
  editor.field("description").input("Допомога спільноті");
  editor.field("imageAlt").input("Логотип");
  await editor.button("Deutsch").click();
  editor.field("description").input("Hilfe für die Gemeinschaft");
  editor.field("imageAlt").input("Logo");
  await editor.button("Обрати зображення").click();
  editor.choose({ id: 42, filename: "logo.png" });
  await editor.button("Зберегти чернетку").click();
  const write = editor.requests.find((item) => item.body);
  assert.equal(write.path, "/sonnenblume/v1/partners");
  assert.equal(write.body.data.description.uk, "Допомога спільноті");
  assert.equal(write.body.data.description.de, "Hilfe für die Gemeinschaft");
  assert.equal(write.body.data.imageId, 42);
  assert.equal(editor.field("slug").readOnly, true);
});

test("partner author may submit but cannot publish or withdraw", async () => {
  const editor = await app(false, "partners");
  assert.ok(editor.button("На перевірку"));
  assert.equal(editor.button("Опублікувати"), undefined);
  assert.equal(editor.button("Зняти з публікації"), undefined);
});
