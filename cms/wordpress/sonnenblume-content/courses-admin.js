/* global wp */
(() => {
  "use strict";
  const config = window.SNB_CONTENT;
  const root = document.getElementById("snb-app");
  if (!root || config?.collection !== "courses") return;
  let items = [];
  let selected = null;
  let language = "uk";
  let view = "active";
  let dirty = false;
  let busy = false;
  let mediaFrame;
  const fields = {};
  const translatedNames = [
    "title",
    "summary",
    "description",
    "ageGroup",
    "language",
    "format",
    "location",
    "price",
    "duration",
    "outcomes",
    "materials",
    "schedule",
    "imageAlt",
  ];
  const defaults = () => ({
    slug: "",
    title: { uk: "", de: "" },
    summary: { uk: "", de: "" },
    description: { uk: "", de: "" },
    ageGroup: { uk: "", de: "" },
    language: { uk: "", de: "" },
    format: { uk: "очно", de: "vor Ort" },
    location: {
      uk: "Hauptstraße 91, 41236 Mönchengladbach",
      de: "Hauptstraße 91, 41236 Mönchengladbach",
    },
    price: { uk: "", de: "" },
    duration: { uk: "", de: "" },
    outcomes: { uk: [], de: [] },
    materials: { uk: [], de: [] },
    schedule: [],
    category: "language",
    enrollmentStatus: "planned",
    startsAt: "",
    seatsTotal: 0,
    seatsAvailable: 0,
    teacherIds: [],
    relatedCourseIds: [],
    imageAlt: { uk: "", de: "" },
    imageId: 0,
    imageFocus: 50,
    isFeatured: false,
    order: 10,
  });
  let data = defaults();

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, className, handler) {
    const node = element("button", className, text);
    node.type = "button";
    node.addEventListener("click", handler);
    return node;
  }
  const notice = element("div", "snb-notice");
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  const header = element("header", "snb-header");
  const heading = element("div");
  heading.append(
    element("p", "snb-eyebrow", "SONNENBLUME · Керування контентом"),
    element("h1", "", "Курси та регулярні заняття"),
    element(
      "p",
      "snb-muted",
      "Розклад, умови участі, фото та викладачі українською і німецькою.",
    ),
  );
  header.append(
    heading,
    element(
      "span",
      "snb-user",
      `${config.userName} · ${config.canPublish ? "Редактор" : "Автор"}`,
    ),
  );
  const navigation = element("nav", "snb-collections");
  navigation.setAttribute("aria-label", "Розділи контенту");
  for (const [page, label] of [
    ["sonnenblume-content", "Новини"],
    ["sonnenblume-people", "Люди"],
    ["sonnenblume-courses", "Курси"],
    ["sonnenblume-events", "Події"],
    ["sonnenblume-volunteer", "Волонтерство"],
    ["sonnenblume-partners", "Партнери"],
  ]) {
    const link = element("a", "snb-tab", label);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("page", page);
    link.href = url.href;
    if (page === "sonnenblume-courses")
      link.setAttribute("aria-current", "page");
    navigation.append(link);
  }

  const layout = element("div", "snb-layout");
  const sidebar = element("aside", "snb-sidebar");
  const tools = element("div", "snb-list-tools");
  tools.append(
    button("+ Новий курс", "button button-primary", () => open(null)),
    button("Оновити список", "button", load),
  );
  const filters = element("div", "snb-filters");
  const filterButtons = {};
  for (const [value, label] of [
    ["active", "Актуальні"],
    ["review", "На перевірці"],
    ["archive", "Архів"],
  ]) {
    filterButtons[value] = button(label, "snb-tab", () => {
      view = value;
      renderList();
    });
    filters.append(filterButtons[value]);
  }
  const list = element("div", "snb-list");
  sidebar.append(tools, filters, list);

  const editor = element("section", "snb-editor");
  editor.setAttribute("aria-label", "Редагування курсу");
  const editorTitle = element("h2", "", "Новий курс");
  const status = element("p", "snb-muted", "Чернетка · ще не збережено");
  const tabs = element("div", "snb-tabs");
  const languageButtons = {};
  for (const [locale, label] of [
    ["uk", "Українська"],
    ["de", "Deutsch"],
  ]) {
    languageButtons[locale] = button(label, "snb-tab", () => {
      language = locale;
      fill();
    });
    tabs.append(languageButtons[locale]);
  }
  const form = element("form", "snb-form");
  form.addEventListener("submit", (event) => event.preventDefault());
  function localizedField(name, label, multiline, max) {
    const wrap = element("label", "snb-field");
    const input = element(multiline ? "textarea" : "input");
    if (!multiline) input.type = "text";
    input.maxLength = max;
    input.id = `snb-${name}`;
    if (multiline) input.rows = name === "description" ? 7 : 4;
    input.addEventListener("input", () => {
      if (name === "outcomes" || name === "materials")
        data[name][language] = lines(input.value);
      else if (name === "schedule") setSchedule(input.value);
      else data[name][language] = input.value;
      change();
    });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    form.append(wrap);
  }
  localizedField("title", "Назва курсу", false, 160);
  localizedField("summary", "Короткий опис · для картки", true, 500);
  localizedField("description", "Повний опис", true, 8000);

  const slug = element("input");
  slug.type = "text";
  slug.maxLength = 70;
  slug.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
  slug.id = "snb-slug";
  slug.addEventListener("input", () => {
    data.slug = slug.value;
    change();
  });
  const slugLabel = element("label", "snb-field");
  slugLabel.append(
    element("span", "", "Адреса · латиницею, після збереження незмінна"),
    slug,
  );
  form.append(slugLabel);

  function selectField(name, label, options) {
    const wrap = element("label", "snb-field");
    const input = element("select");
    input.id = `snb-${name}`;
    for (const [value, text] of options) {
      const option = element("option", "", text);
      option.value = value;
      input.append(option);
    }
    input.addEventListener("change", () => {
      data[name] = input.value;
      change();
    });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    form.append(wrap);
  }
  selectField("category", "Категорія", [
    ["language", "Мовний курс"],
    ["children", "Для дітей"],
    ["culture", "Культура"],
    ["integration", "Інтеграція"],
    ["creative", "Творчість"],
  ]);
  selectField("enrollmentStatus", "Статус набору", [
    ["open", "Набір відкрито"],
    ["waitlist", "Лист очікування"],
    ["closed", "Набір закрито"],
    ["planned", "Планується"],
  ]);
  for (const [name, label, max] of [
    ["ageGroup", "Вік", 160],
    ["language", "Мова занять", 160],
    ["format", "Формат", 160],
    ["location", "Місце", 300],
    ["price", "Вартість / умови", 300],
    ["duration", "Тривалість", 160],
  ])
    localizedField(name, label, false, max);
  localizedField(
    "outcomes",
    "Що отримає учасник · один пункт у рядку",
    true,
    4000,
  );
  localizedField("materials", "Матеріали · один пункт у рядку", true, 4000);
  localizedField(
    "schedule",
    "Розклад · день | час | періодичність, один рядок на заняття",
    true,
    4000,
  );

  const compact = element("div", "snb-options");
  function numberField(name, label, max) {
    const wrap = element("label", "snb-field");
    const input = element("input");
    input.type = "number";
    input.min = "0";
    input.max = String(max);
    input.step = "1";
    input.addEventListener("input", () => {
      data[name] = Number(input.value);
      change();
    });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    compact.append(wrap);
  }
  const startsWrap = element("label", "snb-field");
  const startsAt = element("input");
  startsAt.type = "date";
  startsAt.addEventListener("input", () => {
    data.startsAt = startsAt.value;
    change();
  });
  fields.startsAt = startsAt;
  startsWrap.append(
    element("span", "", "Дата початку · необов’язково"),
    startsAt,
  );
  compact.append(startsWrap);
  numberField("seatsTotal", "Усього місць · 0 якщо не рахуємо", 10000);
  numberField("seatsAvailable", "Вільно місць", 10000);
  numberField("order", "Порядок · менше число вище", 999);
  form.append(compact);

  const teachers = element("fieldset", "snb-role-options");
  teachers.append(
    element("legend", "", "Викладачі · тільки опубліковані профілі"),
  );
  const teacherInputs = {};
  for (const teacher of config.teacherOptions || []) {
    const wrap = element("label", "snb-checkbox");
    const input = element("input");
    input.type = "checkbox";
    input.addEventListener("change", () => {
      data.teacherIds = Object.entries(teacherInputs)
        .filter(([, node]) => node.checked)
        .map(([id]) => id);
      change();
    });
    teacherInputs[teacher.id] = input;
    wrap.append(input, element("span", "", teacher.name.uk || teacher.name.de));
    teachers.append(wrap);
  }
  if (!config.teacherOptions?.length)
    teachers.append(
      element(
        "p",
        "snb-muted",
        "Спочатку опублікуйте викладача у розділі «Люди».",
      ),
    );
  form.append(teachers);

  const related = element("fieldset", "snb-role-options");
  related.append(element("legend", "", "Схожі курси · необов’язково"));
  form.append(related);

  const media = element("div", "snb-media");
  const imageStatus = element("p", "snb-muted", "Зображення ще не вибране.");
  const previewImage = element("img", "snb-preview-image");
  previewImage.hidden = true;
  const chooseImage = button(
    "Обрати / завантажити зображення",
    "button",
    () => {
      if (!mediaFrame) {
        mediaFrame = wp.media({
          title: "Зображення курсу",
          button: { text: "Використати зображення" },
          library: { type: "image" },
          multiple: false,
        });
        mediaFrame.on("select", () => {
          const attachment = mediaFrame
            .state()
            .get("selection")
            .first()
            .toJSON();
          if (
            !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
              attachment.mime,
            )
          ) {
            show("Оберіть JPEG, PNG, WebP або AVIF.", true);
            return;
          }
          data.imageId = attachment.id;
          previewImage.src = attachment.sizes?.large?.url || attachment.url;
          previewImage.hidden = false;
          change();
          fillMedia();
        });
      }
      mediaFrame.open();
    },
  );
  const removeImage = button("Прибрати зображення", "button", () => {
    data.imageId = 0;
    previewImage.hidden = true;
    previewImage.removeAttribute("src");
    change();
    fillMedia();
  });
  media.append(imageStatus, chooseImage, removeImage);
  form.append(media);
  localizedField(
    "imageAlt",
    "Опис зображення для людей, які його не бачать",
    false,
    180,
  );
  const focusLabel = element("label", "snb-field");
  const focus = element("input");
  focus.type = "range";
  focus.min = "0";
  focus.max = "100";
  focus.addEventListener("input", () => {
    data.imageFocus = Number(focus.value);
    change();
  });
  focusLabel.append(element("span", "", "Фокус кадру · зверху → знизу"), focus);
  form.append(focusLabel);
  const featuredLabel = element("label", "snb-checkbox");
  const featured = element("input");
  featured.type = "checkbox";
  featured.addEventListener("change", () => {
    data.isFeatured = featured.checked;
    change();
  });
  featuredLabel.append(
    featured,
    element("span", "", "Показувати серед рекомендованих курсів"),
  );
  form.append(featuredLabel);

  const actions = element("div", "snb-actions");
  const save = button("Зберегти чернетку", "button", () => write("save"));
  const submit = button("На перевірку", "button", () => write("submit"));
  const publish = button("Опублікувати", "button button-primary", () =>
    write("publish"),
  );
  const archive = button("Зняти з публікації", "button snb-danger", () => {
    if (dirty)
      return show("Спочатку збережіть або відкиньте незбережені зміни.", true);
    if (
      window.confirm(
        "Курс та його адреса зникнуть із сайту. Історія залишиться. Продовжити?",
      )
    )
      write("archive");
  });
  actions.append(save, submit);
  if (config.canPublish) actions.append(publish, archive);
  const history = element("details", "snb-history");
  const historyList = element("div");
  history.append(
    element("summary", "", "Історія · останні 20 версій"),
    historyList,
  );
  editor.append(
    editorTitle,
    status,
    tabs,
    form,
    actions,
    element(
      "p",
      "snb-muted",
      "Чернетка не змінює сайт. Для публікації потрібні обидві мови, зображення та схвалення редактора. Кількість місць тут інформаційна і не замінює список реєстрацій.",
    ),
    history,
  );

  const preview = element("aside", "snb-preview");
  const previewCard = element("article", "snb-preview-card");
  const previewStatus = element("p", "snb-preview-status");
  const previewTitle = element("h3");
  const previewText = element("p", "snb-preview-text");
  previewCard.append(previewImage, previewStatus, previewTitle, previewText);
  preview.append(
    element("p", "snb-eyebrow", "Попередній перегляд · обрана мова"),
    previewCard,
    element(
      "p",
      "snb-muted",
      "Публічний сайт показує тільки останню схвалену версію.",
    ),
  );
  layout.append(sidebar, editor, preview);
  root.append(header, navigation, notice, layout);

  function lines(value) {
    return value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  function scheduleText() {
    return data.schedule
      .map(
        (row) =>
          `${row.weekday[language]} | ${row.time} | ${row.cadence[language]}`,
      )
      .join("\n");
  }
  function setSchedule(value) {
    const rows = lines(value).map((row) =>
      row.split("|").map((part) => part.trim()),
    );
    data.schedule = rows.map(
      ([weekday = "", time = "", cadence = ""], index) => ({
        weekday: {
          uk: data.schedule[index]?.weekday.uk || "",
          de: data.schedule[index]?.weekday.de || "",
          [language]: weekday,
        },
        time,
        cadence: {
          uk: data.schedule[index]?.cadence.uk || "",
          de: data.schedule[index]?.cadence.de || "",
          [language]: cadence,
        },
      }),
    );
  }
  function show(message, error = false) {
    notice.textContent = message;
    notice.classList.toggle("is-error", error);
    notice.hidden = !message;
  }
  function stateLabel(item) {
    if (item.archived) return "Архів";
    if (item.workflow === "review")
      return item.hasLive
        ? "Опубліковано · зміни на перевірці"
        : "На перевірці";
    if (item.hasLive)
      return item.hasChanges
        ? "Опубліковано · є чернетка змін"
        : "Опубліковано";
    return "Чернетка";
  }
  function renderList() {
    list.replaceChildren();
    const visible = items.filter((item) =>
      view === "archive"
        ? item.archived
        : !item.archived && (view !== "review" || item.workflow === "review"),
    );
    for (const value of ["active", "review", "archive"])
      filterButtons[value].setAttribute("aria-pressed", String(value === view));
    if (!visible.length)
      list.append(element("p", "snb-muted", "У цьому списку немає курсів."));
    for (const item of visible) {
      const row = button(
        "",
        `snb-list-item${selected?.id === item.id ? " is-selected" : ""}`,
        () => open(item),
      );
      row.append(
        element("strong", "", item.data.title.uk || item.data.title.de),
        element("span", "", stateLabel(item)),
        element("small", "", item.authorName),
      );
      list.append(row);
    }
  }
  function updatePreview() {
    previewTitle.textContent = data.title[language] || "Назва курсу";
    previewStatus.textContent = {
      open: "Набір відкрито",
      waitlist: "Лист очікування",
      closed: "Набір закрито",
      planned: "Планується",
    }[data.enrollmentStatus];
    previewText.textContent =
      data.summary[language] || "Тут з’явиться короткий опис…";
    previewImage.alt = data.imageAlt[language];
    previewImage.style.objectPosition = `50% ${data.imageFocus}%`;
  }
  function change() {
    dirty = true;
    status.textContent = "Є незбережені зміни";
    updatePreview();
  }
  function fillMedia() {
    imageStatus.textContent = data.imageId
      ? `Зображення №${data.imageId}`
      : "Зображення ще не вибране.";
    removeImage.hidden = !data.imageId;
    fields.imageAlt.parentElement.hidden = !data.imageId;
    focusLabel.hidden = !data.imageId;
  }
  function fillRelations() {
    related.replaceChildren(
      element("legend", "", "Схожі курси · необов’язково"),
    );
    const choices = items.filter(
      (item) => !item.archived && item.id !== selected?.id,
    );
    for (const item of choices) {
      const id = item.data.contentId;
      const wrap = element("label", "snb-checkbox");
      const input = element("input");
      input.type = "checkbox";
      input.checked = data.relatedCourseIds.includes(id);
      input.addEventListener("change", () => {
        data.relatedCourseIds = input.checked
          ? [...new Set([...data.relatedCourseIds, id])]
          : data.relatedCourseIds.filter((value) => value !== id);
        change();
      });
      wrap.append(
        input,
        element("span", "", item.data.title.uk || item.data.title.de),
      );
      related.append(wrap);
    }
    if (!choices.length)
      related.append(
        element("p", "snb-muted", "Інших актуальних курсів поки немає."),
      );
  }
  function fill() {
    for (const name of translatedNames) {
      if (name === "outcomes" || name === "materials")
        fields[name].value = data[name][language].join("\n");
      else if (name === "schedule") fields.schedule.value = scheduleText();
      else fields[name].value = data[name][language];
      fields[name].lang = language;
    }
    for (const locale of ["uk", "de"])
      languageButtons[locale].setAttribute(
        "aria-pressed",
        String(locale === language),
      );
    slug.value = data.slug;
    slug.readOnly = Boolean(selected);
    for (const name of [
      "category",
      "enrollmentStatus",
      "startsAt",
      "seatsTotal",
      "seatsAvailable",
      "order",
    ])
      fields[name].value = String(data[name]);
    for (const [id, input] of Object.entries(teacherInputs))
      input.checked = data.teacherIds.includes(id);
    fillRelations();
    featured.checked = data.isFeatured;
    focus.value = String(data.imageFocus);
    fillMedia();
    updatePreview();
  }
  async function open(item, fresh = true) {
    if (busy) return;
    if (
      dirty &&
      !window.confirm("Відкинути незбережені зміни й відкрити інший курс?")
    )
      return;
    if (item && fresh) {
      setBusy(true);
      try {
        item = await api(`/${item.id}`);
      } catch (error) {
        show(error.message, true);
        return;
      } finally {
        setBusy(false);
      }
    }
    selected = item;
    data = structuredClone(item?.data || defaults());
    dirty = false;
    editorTitle.textContent = item ? "Редагування курсу" : "Новий курс";
    status.textContent = item
      ? `${stateLabel(item)} · версія ${item.revision}`
      : "Чернетка · ще не збережено";
    archive.hidden = !item?.hasLive;
    historyList.replaceChildren();
    for (const entry of item?.history || []) {
      const row = element("div", "snb-history-row");
      row.append(
        element(
          "span",
          "",
          `Версія ${entry.revision} · ${new Date(entry.at).toLocaleString("uk-UA")}`,
        ),
      );
      if (config.canPublish)
        row.append(
          button("Відновити у чернетку", "button", () =>
            write("restore", entry.revision),
          ),
        );
      historyList.append(row);
    }
    if (!item?.history.length)
      historyList.append(
        element(
          "p",
          "snb-muted",
          "Історія з’явиться після наступного збереження.",
        ),
      );
    previewImage.hidden = true;
    previewImage.removeAttribute("src");
    fill();
    renderList();
    show("");
    if (data.imageId) {
      const imageId = data.imageId;
      try {
        const attachment = await wp.media.attachment(imageId).fetch();
        if (data.imageId === imageId) {
          previewImage.src = attachment.sizes?.large?.url || attachment.url;
          previewImage.hidden = false;
        }
      } catch {
        show("Не вдалося завантажити попередній перегляд зображення.", true);
      }
    }
  }
  async function api(path = "", body) {
    const url = new URL(config.api);
    if (url.searchParams.has("rest_route"))
      url.searchParams.set(
        "rest_route",
        url.searchParams.get("rest_route").replace(/\/$/, "") + path,
      );
    else url.pathname = url.pathname.replace(/\/$/, "") + path;
    let response;
    try {
      response = await fetch(url, {
        method: body ? "POST" : "GET",
        credentials: "same-origin",
        headers: {
          "X-WP-Nonce": config.nonce,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      });
    } catch {
      throw new Error(
        "Немає відповіді сервера. Ваш текст залишився у формі; оновіть список перед повтором.",
      );
    }
    const nextNonce = response.headers.get("X-WP-Nonce");
    if (nextNonce) config.nonce = nextNonce;
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Сервер повернув незрозумілу відповідь. Ваш текст не втрачено.",
      );
    }
    if (!response.ok)
      throw new Error(
        response.status === 401 || result.code === "rest_cookie_invalid_nonce"
          ? "Сесія закінчилася. Скопіюйте незбережений текст і увійдіть знову."
          : result.message || "Не вдалося зберегти.",
      );
    return result;
  }
  function setBusy(value) {
    busy = value;
    root.setAttribute("aria-busy", String(value));
    for (const control of root.querySelectorAll("button,input,textarea,select"))
      control.disabled = value;
  }
  async function load() {
    if (busy) return;
    setBusy(true);
    show("Завантаження…");
    try {
      items = (await api()).items;
      renderList();
      fillRelations();
      show(
        dirty ? "Список оновлено. Незбережений текст залишився у формі." : "",
      );
    } catch (error) {
      show(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  async function write(action, targetRevision) {
    if (busy) return;
    setBusy(true);
    show("Збереження…");
    try {
      const result = await api(selected ? `/${selected.id}` : "", {
        action,
        revision: selected?.revision,
        data,
        targetRevision,
      });
      items = [result, ...items.filter((item) => item.id !== result.id)];
      dirty = false;
      setBusy(false);
      await open(result, false);
      show(
        action === "publish"
          ? "Опубліковано. Серверна версія оновиться протягом хвилини; GitHub Pages потребує нової збірки."
          : action === "archive"
            ? "Курс знято з публікації."
            : action === "submit"
              ? "Надіслано редактору на перевірку."
              : action === "restore"
                ? "Версію відновлено у чернетку."
                : "Чернетку збережено. Публічний курс не змінено.",
      );
    } catch (error) {
      show(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
  fill();
  load();
})();
