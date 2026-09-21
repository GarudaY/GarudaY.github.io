(() => {
  "use strict";
  const config = window.SNB_CONTENT;
  const root = document.getElementById("snb-app");
  if (!root || config?.collection !== "volunteer") return;

  let items = [];
  let selected = null;
  let language = "uk";
  let view = "active";
  let dirty = false;
  let busy = false;
  let data = defaults();
  const fields = {};
  const translated = ["title", "description", "time", "location"];
  function defaults() {
    return {
      slug: "",
      title: { uk: "", de: "" },
      description: { uk: "", de: "" },
      time: { uk: "", de: "" },
      location: { uk: "", de: "" },
      icon: "heart",
      order: 10,
    };
  }
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function button(text, className, action) {
    const element = node("button", className, text);
    element.type = "button";
    element.addEventListener("click", action);
    return element;
  }
  const notice = node("div", "snb-notice");
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  const header = node("header", "snb-header");
  const intro = node("div");
  intro.append(
    node("p", "snb-eyebrow", "SONNENBLUME · Керування контентом"),
    node("h1", "", "Волонтерські завдання"),
    node("p", "snb-muted", "Завдання на сторінці «Долучитися». Заявки й особисті дані тут недоступні."),
  );
  header.append(intro, node("span", "snb-user", `${config.userName} · ${config.canPublish ? "Редактор" : "Автор"}`));
  const navigation = node("nav", "snb-collections");
  navigation.setAttribute("aria-label", "Розділи контенту");
  for (const [page, label] of [
    ["sonnenblume-content", "Новини"],
    ["sonnenblume-people", "Люди"],
    ["sonnenblume-courses", "Курси"],
    ["sonnenblume-events", "Події"],
    ["sonnenblume-volunteer", "Волонтерство"],
    ["sonnenblume-partners", "Партнери"],
  ]) {
    const link = node("a", "snb-tab", label);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("page", page);
    link.href = url.href;
    if (page === "sonnenblume-volunteer") link.setAttribute("aria-current", "page");
    navigation.append(link);
  }
  const layout = node("div", "snb-layout");
  const sidebar = node("aside", "snb-sidebar");
  const tools = node("div", "snb-list-tools");
  tools.append(
    button("+ Нове завдання", "button button-primary", () => open(null)),
    button("Оновити список", "button", load),
  );
  const filters = node("div", "snb-filters");
  const filterButtons = {};
  for (const [key, label] of [
    ["active", "Актуальні"],
    ["review", "На перевірці"],
    ["archive", "Архів"],
  ]) {
    filterButtons[key] = button(label, "snb-tab", () => {
      view = key;
      renderList();
    });
    filters.append(filterButtons[key]);
  }
  const list = node("div", "snb-list");
  sidebar.append(tools, filters, list);
  const editor = node("section", "snb-editor");
  editor.setAttribute("aria-label", "Редагування волонтерського завдання");
  const editorTitle = node("h2", "", "Нове завдання");
  const status = node("p", "snb-muted", "Чернетка · ще не збережено");
  const tabs = node("div", "snb-tabs");
  const languageButtons = {};
  for (const [locale, label] of [["uk", "Українська"], ["de", "Deutsch"]]) {
    languageButtons[locale] = button(label, "snb-tab", () => {
      language = locale;
      fill();
    });
    tabs.append(languageButtons[locale]);
  }
  const form = node("form", "snb-form");
  form.addEventListener("submit", (event) => event.preventDefault());
  function localizedField(name, label, max, multiline = false) {
    const wrap = node("label", "snb-field");
    const input = node(multiline ? "textarea" : "input");
    if (!multiline) input.type = "text";
    input.id = `snb-${name}`;
    input.maxLength = max;
    if (multiline) input.rows = 5;
    input.addEventListener("input", () => {
      data[name][language] = input.value;
      change();
    });
    fields[name] = input;
    wrap.append(node("span", "", label), input);
    form.append(wrap);
  }
  localizedField("title", "Назва завдання", 160);
  localizedField("description", "Що саме потрібно робити", 1200, true);
  localizedField("time", "Час / періодичність", 180);
  localizedField("location", "Місце / формат", 180);
  const slugWrap = node("label", "snb-field");
  fields.slug = node("input");
  fields.slug.type = "text";
  fields.slug.id = "snb-slug";
  fields.slug.maxLength = 70;
  fields.slug.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
  fields.slug.addEventListener("input", () => {
    data.slug = fields.slug.value;
    change();
  });
  slugWrap.append(node("span", "", "Код завдання · латиницею, після збереження незмінний"), fields.slug);
  form.append(slugWrap);
  const iconWrap = node("label", "snb-field");
  fields.icon = node("select");
  fields.icon.id = "snb-icon";
  for (const [value, label] of [
    ["heart", "Серце"], ["calendar", "Календар"], ["camera", "Камера"],
    ["languages", "Мови"], ["list", "Список"],
  ]) {
    const option = node("option", "", label);
    option.value = value;
    fields.icon.append(option);
  }
  fields.icon.addEventListener("change", () => {
    data.icon = fields.icon.value;
    change();
  });
  iconWrap.append(node("span", "", "Піктограма"), fields.icon);
  form.append(iconWrap);
  const orderWrap = node("label", "snb-field");
  fields.order = node("input");
  fields.order.type = "number";
  fields.order.id = "snb-order";
  fields.order.min = "0";
  fields.order.max = "999";
  fields.order.addEventListener("input", () => {
    data.order = Number(fields.order.value);
    change();
  });
  orderWrap.append(node("span", "", "Порядок на сторінці · 0–999"), fields.order);
  form.append(orderWrap);
  const actions = node("div", "snb-actions");
  actions.append(
    button("Зберегти чернетку", "button", () => write("save")),
    button("На перевірку", "button", () => write("submit")),
  );
  if (config.canPublish) actions.append(button("Опублікувати", "button button-primary", () => write("publish")));
  const archive = button("Зняти з публікації", "button", () => {
    if (window.confirm("Зняти завдання з публікації? Історія залишиться.")) write("archive");
  });
  if (config.canPublish) actions.append(archive);
  const historyHeading = node("h3", "", "Попередні версії");
  const historyList = node("div", "snb-history");
  editor.append(editorTitle, status, tabs, form, actions, historyHeading, historyList);
  layout.append(sidebar, editor);
  root.append(header, navigation, notice, layout);

  function show(message, error = false) {
    notice.textContent = message;
    notice.classList.toggle("is-error", error);
    notice.hidden = !message;
  }
  function change() {
    dirty = true;
    status.textContent = `${selected?.hasLive ? "Опублікована версія не змінена" : "Чернетка"} · незбережені зміни`;
  }
  function label(item) {
    return item.archived ? "Архів" : item.workflow === "review" ? "На перевірці" : item.hasLive ? "Опубліковано" : "Чернетка";
  }
  function renderList() {
    list.replaceChildren();
    for (const [key, control] of Object.entries(filterButtons))
      control.setAttribute("aria-pressed", String(key === view));
    const visible = items.filter((item) =>
      view === "archive" ? item.archived : view === "review" ? !item.archived && item.workflow === "review" : !item.archived && item.workflow !== "review",
    );
    if (!visible.length) list.append(node("p", "snb-muted", "Тут поки немає завдань."));
    for (const item of visible) {
      const control = button(item.data.title.uk || item.data.title.de || item.data.slug, "snb-list-item", () => open(item));
      control.append(node("small", "", label(item)));
      if (item.id === selected?.id) control.setAttribute("aria-current", "true");
      list.append(control);
    }
  }
  function fill() {
    for (const name of translated) {
      fields[name].value = data[name][language];
      fields[name].lang = language;
    }
    for (const locale of ["uk", "de"])
      languageButtons[locale].setAttribute("aria-pressed", String(locale === language));
    fields.slug.value = data.slug;
    fields.slug.readOnly = Boolean(selected);
    fields.icon.value = data.icon;
    fields.order.value = String(data.order);
  }
  async function open(item, fresh = true) {
    if (busy) return;
    if (dirty && !window.confirm("Відкинути незбережені зміни й відкрити інше завдання?")) return;
    if (item && fresh) {
      setBusy(true);
      try { item = await api(`/${item.id}`); }
      catch (error) { show(error.message, true); return; }
      finally { setBusy(false); }
    }
    selected = item;
    data = structuredClone(item?.data || defaults());
    dirty = false;
    editorTitle.textContent = item ? "Редагування завдання" : "Нове завдання";
    status.textContent = item ? `${label(item)} · версія ${item.revision}` : "Чернетка · ще не збережено";
    archive.hidden = !item?.hasLive;
    historyList.replaceChildren();
    for (const entry of item?.history || []) {
      const row = node("div", "snb-history-row");
      row.append(node("span", "", `Версія ${entry.revision} · ${new Date(entry.at).toLocaleString("uk-UA")}`));
      if (config.canPublish) row.append(button("Відновити у чернетку", "button", () => write("restore", entry.revision)));
      historyList.append(row);
    }
    if (!item?.history.length) historyList.append(node("p", "snb-muted", "Історія з’явиться після наступного збереження."));
    fill();
    renderList();
    show("");
  }
  async function api(path = "", body) {
    const url = new URL(config.api);
    if (url.searchParams.has("rest_route"))
      url.searchParams.set("rest_route", url.searchParams.get("rest_route").replace(/\/$/, "") + path);
    else url.pathname = url.pathname.replace(/\/$/, "") + path;
    let response;
    try {
      response = await fetch(url, {
        method: body ? "POST" : "GET",
        credentials: "same-origin",
        headers: { "X-WP-Nonce": config.nonce, ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new Error("Немає відповіді сервера. Текст залишився у формі; оновіть список перед повтором.");
    }
    const nextNonce = response.headers.get("X-WP-Nonce");
    if (nextNonce) config.nonce = nextNonce;
    let result;
    try { result = await response.json(); }
    catch { throw new Error("Сервер повернув незрозумілу відповідь. Текст не втрачено."); }
    if (!response.ok)
      throw new Error(response.status === 401 || result.code === "rest_cookie_invalid_nonce"
        ? "Сесія закінчилася. Скопіюйте незбережений текст і увійдіть знову."
        : result.message || "Не вдалося зберегти.");
    return result;
  }
  function setBusy(value) {
    busy = value;
    root.setAttribute("aria-busy", String(value));
    for (const control of root.querySelectorAll("button,input,textarea,select")) control.disabled = value;
  }
  async function load() {
    if (busy) return;
    setBusy(true);
    show("Завантаження…");
    try {
      items = (await api()).items;
      renderList();
      show(dirty ? "Список оновлено. Незбережений текст залишився у формі." : "");
    } catch (error) { show(error.message, true); }
    finally { setBusy(false); }
  }
  async function write(action, targetRevision) {
    if (busy) return;
    setBusy(true);
    show("Збереження…");
    try {
      const result = await api(selected ? `/${selected.id}` : "", {
        action, revision: selected?.revision, data: structuredClone(data), targetRevision,
      });
      items = [result, ...items.filter((item) => item.id !== result.id)];
      dirty = false;
      setBusy(false);
      await open(result, false);
      show(action === "publish"
        ? "Опубліковано. Серверна версія оновиться протягом хвилини; GitHub Pages потребує нової збірки."
        : action === "archive" ? "Завдання знято з публікації."
        : action === "submit" ? "Надіслано редактору на перевірку."
        : action === "restore" ? "Версію відновлено у чернетку."
        : "Чернетку збережено. Публічна сторінка не змінена.");
    } catch (error) { show(error.message, true); }
    finally { setBusy(false); }
  }
  window.addEventListener("beforeunload", (event) => {
    if (dirty) event.preventDefault();
  });
  open(null, false);
  load();
})();
