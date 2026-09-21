(() => {
  "use strict";
  const config = window.SNB_CONTENT;
  const root = document.getElementById("snb-app");
  if (!root || config?.collection !== "partners") return;

  const blank = () => ({
    slug: "", kind: "organization", name: "", description: { uk: "", de: "" },
    website: "", order: 10, imageId: 0, imageAlt: { uk: "", de: "" },
    imageFocus: 50, publicationPermission: false,
  });
  let items = [], selected = null, data = blank(), language = "uk", view = "active";
  let dirty = false, busy = false, initialized = false;
  const fields = {};
  const element = (tag, cls, label) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (label !== undefined) node.textContent = label;
    return node;
  };
  const button = (label, cls, click) => {
    const node = element("button", cls, label);
    node.type = "button";
    node.addEventListener("click", click);
    return node;
  };
  const notice = element("div", "snb-notice");
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  const header = element("header", "snb-header");
  const intro = element("div");
  intro.append(
    element("p", "snb-eyebrow", "SONNENBLUME · Керування контентом"),
    element("h1", "", "Партнери й подяки"),
    element("p", "snb-muted", "Організації та люди на головній сторінці. Публікуйте приватних осіб лише за їхньою згодою."),
  );
  header.append(intro, element("span", "snb-user", `${config.userName} · ${config.canPublish ? "Редактор" : "Автор"}`));
  const navigation = element("nav", "snb-collections");
  navigation.setAttribute("aria-label", "Розділи контенту");
  for (const [page, label] of [
    ["sonnenblume-content", "Новини"], ["sonnenblume-people", "Люди"],
    ["sonnenblume-courses", "Курси"], ["sonnenblume-events", "Події"],
    ["sonnenblume-volunteer", "Волонтерство"], ["sonnenblume-partners", "Партнери"],
  ]) {
    const link = element("a", "snb-tab", label);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("page", page);
    link.href = url.href;
    if (page === "sonnenblume-partners") link.setAttribute("aria-current", "page");
    navigation.append(link);
  }
  const layout = element("div", "snb-layout");
  const sidebar = element("aside", "snb-sidebar");
  const tools = element("div", "snb-list-tools");
  tools.append(button("+ Новий запис", "button button-primary", () => open(null)), button("Оновити список", "button", load));
  const activate = button("Замінити список на сайті", "button", async () => {
    if (busy || dirty) { show("Спочатку збережіть незавершені зміни.", true); return; }
    if (!window.confirm("Після заміни сайт показуватиме тільки опубліковані тут записи. Перевірте, що всі потрібні організації вже внесено. Продовжити?")) return;
    setBusy(true);
    try {
      await api("/activate", {});
      initialized = true;
      activate.hidden = true;
      show("Список CMS увімкнено. Зняті з публікації записи не повернуться зі старої версії.");
    } catch (error) { show(error.message, true); }
    finally { setBusy(false); }
  });
  if (config.canPublish) tools.append(activate);
  const filters = element("div", "snb-filters");
  const filterButtons = {};
  for (const [key, label] of [["active", "Актуальні"], ["review", "На перевірці"], ["archive", "Архів"]]) {
    filterButtons[key] = button(label, "snb-tab", () => { view = key; renderList(); });
    filters.append(filterButtons[key]);
  }
  const list = element("div", "snb-list");
  sidebar.append(tools, filters, list);
  const editor = element("section", "snb-editor");
  editor.setAttribute("aria-label", "Редагування партнера");
  const editorTitle = element("h2", "", "Новий запис");
  const status = element("p", "snb-muted", "Чернетка · ще не збережено");
  const tabs = element("div", "snb-tabs");
  const languageButtons = {};
  for (const [locale, label] of [["uk", "Українська"], ["de", "Deutsch"]]) {
    languageButtons[locale] = button(label, "snb-tab", () => { language = locale; fill(); });
    tabs.append(languageButtons[locale]);
  }
  const form = element("form", "snb-form");
  form.addEventListener("submit", (event) => event.preventDefault());
  function field(name, label, max, options = {}) {
    const wrap = element("label", "snb-field");
    const input = element(options.multiline ? "textarea" : "input");
    if (!options.multiline) input.type = "text";
    input.id = `snb-${name}`;
    input.maxLength = max;
    if (options.multiline) input.rows = 4;
    input.addEventListener("input", () => {
      data[name][language] = input.value;
      change();
    });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    form.append(wrap);
  }
  // Plain fields use a separate change handler to avoid altering translation objects.
  function plain(name, label, max, type = "text") {
    const wrap = element("label", "snb-field");
    const input = element("input");
    input.id = `snb-${name}`;
    input.type = type;
    input.maxLength = max;
    input.addEventListener("input", () => { data[name] = input.value; change(); });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    form.append(wrap);
  }
  plain("name", "Назва організації / ім’я людини", 160);
  field("description", "За що дякуємо", 800, { multiline: true, translated: true });
  plain("website", "Сайт (необов’язково, HTTPS)", 500, "url");
  plain("slug", "Код запису · латиницею, після збереження незмінний", 70);
  fields.slug.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
  const kindWrap = element("label", "snb-field");
  fields.kind = element("select");
  for (const [value, label] of [["organization", "Організація"], ["person", "Людина"]]) {
    const option = element("option", "", label);
    option.value = value;
    fields.kind.append(option);
  }
  fields.kind.addEventListener("change", () => { data.kind = fields.kind.value; change(); fill(); });
  kindWrap.append(element("span", "", "Тип подяки"), fields.kind);
  form.append(kindWrap);
  const mediaWrap = element("div", "snb-field");
  const mediaLabel = element("span", "", "Логотип / фото з медіатеки");
  const mediaStatus = element("span", "snb-muted", "Зображення не обрано");
  mediaWrap.append(mediaLabel, button("Обрати зображення", "button", () => {
    const picker = wp.media({ title: "Оберіть логотип або фото", button: { text: "Використати" }, library: { type: "image" }, multiple: false });
    picker.on("select", () => {
      const chosen = picker.state().get("selection").first().toJSON();
      data.imageId = chosen.id;
      mediaStatus.textContent = chosen.filename || `Зображення #${chosen.id}`;
      change();
    });
    picker.open();
  }), button("Прибрати", "button", () => { data.imageId = 0; mediaStatus.textContent = "Зображення не обрано"; change(); }), mediaStatus);
  form.append(mediaWrap);
  field("imageAlt", "Опис зображення (для доступності)", 180, { translated: true });
  const orderWrap = element("label", "snb-field");
  fields.order = element("input");
  fields.order.type = "number";
  fields.order.min = "0";
  fields.order.max = "999";
  fields.order.addEventListener("input", () => { data.order = Number(fields.order.value); change(); });
  orderWrap.append(element("span", "", "Порядок на сторінці · 0–999"), fields.order);
  form.append(orderWrap);
  const consentWrap = element("label", "snb-field");
  fields.publicationPermission = element("input");
  fields.publicationPermission.type = "checkbox";
  fields.publicationPermission.addEventListener("change", () => { data.publicationPermission = fields.publicationPermission.checked; change(); });
  consentWrap.append(fields.publicationPermission, element("span", "", "Маю згоду людини на публікацію її імені та фото"));
  form.append(consentWrap);
  const actions = element("div", "snb-actions");
  actions.append(button("Зберегти чернетку", "button", () => write("save")), button("На перевірку", "button", () => write("submit")));
  if (config.canPublish) actions.append(button("Опублікувати", "button button-primary", () => write("publish")));
  const archive = button("Зняти з публікації", "button", () => {
    if (window.confirm("Зняти запис з публікації? Історія залишиться.")) write("archive");
  });
  if (config.canPublish) actions.append(archive);
  const historyList = element("div", "snb-history");
  editor.append(editorTitle, status, tabs, form, actions, element("h3", "", "Попередні версії"), historyList);
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
    for (const [key, control] of Object.entries(filterButtons)) control.setAttribute("aria-pressed", String(key === view));
    const visible = items.filter((item) => view === "archive" ? item.archived : view === "review" ? !item.archived && item.workflow === "review" : !item.archived && item.workflow !== "review");
    if (!visible.length) list.append(element("p", "snb-muted", "Тут поки немає записів."));
    for (const item of visible) {
      const control = button(item.data.name || item.data.slug, "snb-list-item", () => open(item));
      control.append(element("small", "", label(item)));
      if (item.id === selected?.id) control.setAttribute("aria-current", "true");
      list.append(control);
    }
  }
  function fill() {
    fields.name.value = data.name;
    fields.description.value = data.description[language];
    fields.description.lang = language;
    fields.imageAlt.value = data.imageAlt[language];
    fields.imageAlt.lang = language;
    fields.website.value = data.website;
    fields.slug.value = data.slug;
    fields.slug.readOnly = Boolean(selected);
    fields.kind.value = data.kind;
    fields.order.value = String(data.order);
    fields.publicationPermission.checked = data.publicationPermission;
    consentWrap.hidden = data.kind !== "person";
    mediaStatus.textContent = data.imageId ? `Зображення #${data.imageId}` : "Зображення не обрано";
    for (const locale of ["uk", "de"]) languageButtons[locale].setAttribute("aria-pressed", String(locale === language));
  }
  async function open(item, fresh = true) {
    if (busy) return;
    if (dirty && !window.confirm("Відкинути незбережені зміни й відкрити інший запис?")) return;
    if (item && fresh) {
      setBusy(true);
      try { item = await api(`/${item.id}`); }
      catch (error) { show(error.message, true); return; }
      finally { setBusy(false); }
    }
    selected = item;
    data = structuredClone(item?.data || blank());
    dirty = false;
    editorTitle.textContent = item ? "Редагування подяки" : "Новий запис";
    status.textContent = item ? `${label(item)} · версія ${item.revision}` : "Чернетка · ще не збережено";
    archive.hidden = !item?.hasLive;
    historyList.replaceChildren();
    for (const entry of item?.history || []) {
      const row = element("div", "snb-history-row");
      row.append(element("span", "", `Версія ${entry.revision} · ${new Date(entry.at).toLocaleString("uk-UA")}`));
      if (config.canPublish) row.append(button("Відновити у чернетку", "button", () => write("restore", entry.revision)));
      historyList.append(row);
    }
    if (!item?.history.length) historyList.append(element("p", "snb-muted", "Історія з’явиться після наступного збереження."));
    fill(); renderList(); show("");
  }
  async function api(path = "", body) {
    const url = new URL(config.api);
    if (url.searchParams.has("rest_route")) url.searchParams.set("rest_route", url.searchParams.get("rest_route").replace(/\/$/, "") + path);
    else url.pathname = url.pathname.replace(/\/$/, "") + path;
    let response;
    try {
      response = await fetch(url, {
        method: body ? "POST" : "GET", credentials: "same-origin",
        headers: { "X-WP-Nonce": config.nonce, ...(body ? { "Content-Type": "application/json" } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(30000),
      });
    } catch { throw new Error("Немає відповіді сервера. Текст залишився у формі; оновіть список перед повтором."); }
    const nextNonce = response.headers.get("X-WP-Nonce");
    if (nextNonce) config.nonce = nextNonce;
    let result;
    try { result = await response.json(); }
    catch { throw new Error("Сервер повернув незрозумілу відповідь. Текст не втрачено."); }
    if (!response.ok) throw new Error(response.status === 401 || result.code === "rest_cookie_invalid_nonce"
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
    setBusy(true); show("Завантаження…");
    try {
      const result = await api();
      items = result.items;
      initialized = Boolean(result.initialized);
      activate.hidden = initialized;
      renderList();
      show(dirty ? "Список оновлено. Незбережений текст залишився у формі."
        : initialized ? "" : "Поки що сайт показує попередній список. Після публікації всіх потрібних записів редактор має замінити його списком CMS.");
    }
    catch (error) { show(error.message, true); }
    finally { setBusy(false); }
  }
  async function write(action, targetRevision) {
    if (busy) return;
    setBusy(true); show("Збереження…");
    try {
      const result = await api(selected ? `/${selected.id}` : "", { action, revision: selected?.revision, data: structuredClone(data), targetRevision });
      items = [result, ...items.filter((item) => item.id !== result.id)];
      dirty = false;
      setBusy(false);
      await open(result, false);
      show(action === "publish" ? "Опубліковано. Серверна версія оновиться протягом хвилини; GitHub Pages потребує нової збірки."
        : action === "archive" ? "Запис знято з публікації."
        : action === "submit" ? "Надіслано редактору на перевірку."
        : action === "restore" ? "Версію відновлено у чернетку."
        : "Чернетку збережено. Публічна сторінка не змінена.");
    } catch (error) { show(error.message, true); }
    finally { setBusy(false); }
  }
  window.addEventListener("beforeunload", (event) => { if (dirty) event.preventDefault(); });
  open(null, false);
  load();
})();
