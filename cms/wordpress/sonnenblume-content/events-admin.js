/* global wp */
(() => {
  "use strict";
  const config = window.SNB_CONTENT;
  const root = document.getElementById("snb-app");
  if (!root || config?.collection !== "events") return;

  let items = [];
  let selected = null;
  let language = "uk";
  let view = "active";
  let dirty = false;
  let busy = false;
  let coverFrame;
  let galleryFrame;
  const fields = {};
  const translatedNames = [
    "title",
    "summary",
    "description",
    "dateLabel",
    "timeLabel",
    "location",
    "price",
    "registrationLabel",
    "imageAlt",
  ];
  const defaults = () => ({
    slug: "",
    title: { uk: "", de: "" },
    summary: { uk: "", de: "" },
    description: { uk: "", de: "" },
    dateLabel: { uk: "", de: "" },
    timeLabel: { uk: "", de: "" },
    location: {
      uk: "Mönchengladbach",
      de: "Mönchengladbach",
    },
    price: { uk: "Вхід вільний", de: "Eintritt frei" },
    registrationLabel: { uk: "Дізнатися більше", de: "Mehr erfahren" },
    category: "community",
    eventStatus: "upcoming",
    archiveType: "",
    organizerName: "",
    startsAt: "",
    endsAt: "",
    contactEmail: "kontakt@sonnenblume-mg.com",
    capacity: 0,
    seatsAvailable: 0,
    relatedCourseIds: [],
    gallery: [],
    imageId: 0,
    imageAlt: { uk: "", de: "" },
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
  function safeAttachment(attachment) {
    return ["image/jpeg", "image/png", "image/webp", "image/avif"].includes(
      attachment.mime,
    );
  }
  function attachmentUrl(attachment) {
    return attachment.sizes?.large?.url || attachment.url;
  }

  const notice = element("div", "snb-notice");
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  const header = element("header", "snb-header");
  const heading = element("div");
  heading.append(
    element("p", "snb-eyebrow", "SONNENBLUME · Керування контентом"),
    element("h1", "", "Події та архів афіш"),
    element(
      "p",
      "snb-muted",
      "Анонси, фоторозповіді, місце, час і галерея українською та німецькою.",
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
    if (page === "sonnenblume-events")
      link.setAttribute("aria-current", "page");
    navigation.append(link);
  }

  const layout = element("div", "snb-layout");
  const sidebar = element("aside", "snb-sidebar");
  const tools = element("div", "snb-list-tools");
  tools.append(
    button("+ Нова подія", "button button-primary", () => open(null)),
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
  editor.setAttribute("aria-label", "Редагування події");
  const editorTitle = element("h2", "", "Нова подія");
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
      data[name][language] = input.value;
      change();
    });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    form.append(wrap);
  }
  function textField(name, label, max, type = "text") {
    const wrap = element("label", "snb-field");
    const input = element("input");
    input.type = type;
    input.maxLength = max;
    input.id = `snb-${name}`;
    input.addEventListener("input", () => {
      data[name] = input.value;
      change();
    });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    form.append(wrap);
  }
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

  localizedField("title", "Назва події", false, 180);
  localizedField("summary", "Короткий опис · для картки", true, 600);
  localizedField("description", "Повний опис", true, 10000);
  textField(
    "slug",
    "Адреса · латиницею, після першого збереження незмінна",
    90,
  );
  fields.slug.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
  selectField("eventStatus", "Стан події", [
    ["upcoming", "Майбутня"],
    ["past", "Завершена"],
    ["cancelled", "Скасована"],
  ]);
  selectField("category", "Категорія", [
    ["community", "Спільнота"],
    ["culture", "Культура"],
    ["children", "Для дітей"],
    ["integration", "Інтеграція"],
    ["charity", "Благодійність"],
  ]);
  selectField("archiveType", "Вид архівної сторінки", [
    ["", "Фоторозповідь / звичайна подія"],
    ["announcement", "Збережена афіша-анонс"],
  ]);
  textField("organizerName", "Інший організатор · необов’язково", 180);
  textField(
    "startsAt",
    "Початок · YYYY-MM-DD або 2026-10-18T15:00:00+02:00",
    32,
  );
  textField("endsAt", "Завершення в тому самому форматі · необов’язково", 32);
  localizedField("dateLabel", "Людська назва дати · необов’язково", false, 180);
  localizedField("timeLabel", "Людський опис часу · необов’язково", false, 180);
  localizedField("location", "Місце", false, 400);
  localizedField("price", "Вартість / умови входу", false, 300);
  localizedField(
    "registrationLabel",
    "Текст кнопки для майбутньої події",
    false,
    180,
  );
  textField("contactEmail", "Контактний email", 254, "email");

  for (const [name, label] of [
    ["capacity", "Загальна кількість місць · 0 вимикає реєстрацію"],
    ["seatsAvailable", "Місць для онлайн-реєстрації"],
  ]) {
    const wrap = element("label", "snb-field");
    const input = element("input");
    input.type = "number";
    input.id = `snb-${name}`;
    input.min = "0";
    input.max = "500";
    input.addEventListener("input", () => {
      data[name] = Number(input.value);
      change();
    });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    form.append(wrap);
  }

  const orderWrap = element("label", "snb-field");
  const order = element("input");
  order.type = "number";
  order.min = "0";
  order.max = "999";
  order.addEventListener("input", () => {
    data.order = Number(order.value);
    change();
  });
  fields.order = order;
  orderWrap.append(element("span", "", "Порядок"), order);
  form.append(orderWrap);

  const related = element("fieldset", "snb-role-options");
  form.append(related);

  const media = element("div", "snb-media");
  const imageStatus = element("p", "snb-muted", "Обкладинка ще не вибрана.");
  const previewImage = element("img", "snb-preview-image");
  previewImage.hidden = true;
  const chooseImage = button(
    "Обрати / завантажити обкладинку",
    "button",
    () => {
      if (!coverFrame) {
        coverFrame = wp.media({
          title: "Обкладинка події",
          button: { text: "Використати обкладинку" },
          library: { type: "image" },
          multiple: false,
        });
        coverFrame.on("select", () => {
          const attachment = coverFrame
            .state()
            .get("selection")
            .first()
            .toJSON();
          if (!safeAttachment(attachment))
            return show("Оберіть JPEG, PNG, WebP або AVIF.", true);
          data.imageId = attachment.id;
          previewImage.src = attachmentUrl(attachment);
          previewImage.hidden = false;
          change();
          fillMedia();
        });
      }
      coverFrame.open();
    },
  );
  const removeImage = button("Прибрати обкладинку", "button", () => {
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
    "Опис обкладинки для людей, які її не бачать",
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
  focusLabel.append(
    element("span", "", "Фокус обкладинки · зверху → знизу"),
    focus,
  );
  form.append(focusLabel);

  const gallerySection = element("section", "snb-gallery-editor");
  gallerySection.append(
    element("h3", "", "Галерея · до 12 фото"),
    element(
      "p",
      "snb-muted",
      "Для майбутнього анонсу галерея необов’язкова. Для фоторозповіді додайте найсильніші кадри без дублів.",
    ),
  );
  const galleryList = element("div", "snb-gallery-list");
  const addGallery = button("Додати фото", "button", () => {
    if (!galleryFrame) {
      galleryFrame = wp.media({
        title: "Фотографії події",
        button: { text: "Додати до галереї" },
        library: { type: "image" },
        multiple: true,
      });
      galleryFrame.on("select", () => {
        const chosen = galleryFrame.state().get("selection").toJSON();
        for (const attachment of chosen) {
          if (!safeAttachment(attachment)) continue;
          if (data.gallery.some((entry) => entry.imageId === attachment.id))
            continue;
          if (data.gallery.length >= 12) break;
          data.gallery.push({
            imageId: attachment.id,
            imageAlt: { uk: "", de: "" },
            imageFocus: 50,
            imageUrl: attachmentUrl(attachment),
          });
        }
        change();
        renderGallery();
      });
    }
    galleryFrame.open();
  });
  gallerySection.append(addGallery, galleryList);
  form.append(gallerySection);

  const featuredLabel = element("label", "snb-checkbox");
  const featured = element("input");
  featured.type = "checkbox";
  featured.addEventListener("change", () => {
    data.isFeatured = featured.checked;
    change();
  });
  featuredLabel.append(
    featured,
    element("span", "", "Позначити рекомендованою подією"),
  );
  form.append(featuredLabel);

  const capacityNote = element("div", "snb-safety-note");
  capacityNote.append(
    element("strong", "", "Заявки рахуються автоматично"),
    element(
      "p",
      "",
      "Після публікації сайт сам віднімає підтверджених учасників. Якщо місця закінчилися, нові заявки переходять у список очікування.",
    ),
  );
  form.append(capacityNote);

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
        "Подія та її адреса зникнуть із сайту. Історія залишиться. Продовжити?",
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
      "Чернетка не змінює сайт. Публікація потребує обох мов, дати, обкладинки, alt і рішення редактора.",
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
      list.append(element("p", "snb-muted", "У цьому списку немає подій."));
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
    previewTitle.textContent = data.title[language] || "Назва події";
    previewStatus.textContent = {
      upcoming: "Майбутня подія",
      past: "Архів події",
      cancelled: "Скасовано",
    }[data.eventStatus];
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
      ? `Обкладинка №${data.imageId}`
      : "Обкладинка ще не вибрана.";
    removeImage.hidden = !data.imageId;
    fields.imageAlt.parentElement.hidden = !data.imageId;
    focusLabel.hidden = !data.imageId;
  }
  function fillRelations() {
    related.replaceChildren(
      element("legend", "", "Пов’язані курси · необов’язково"),
    );
    for (const course of config.courseOptions || []) {
      const wrap = element("label", "snb-checkbox");
      const input = element("input");
      input.type = "checkbox";
      input.checked = data.relatedCourseIds.includes(course.id);
      input.addEventListener("change", () => {
        data.relatedCourseIds = input.checked
          ? [...new Set([...data.relatedCourseIds, course.id])]
          : data.relatedCourseIds.filter((id) => id !== course.id);
        change();
      });
      wrap.append(
        input,
        element("span", "", course.title.uk || course.title.de),
      );
      related.append(wrap);
    }
    if (!config.courseOptions?.length)
      related.append(
        element("p", "snb-muted", "Опублікованих курсів поки немає."),
      );
  }
  function renderGallery() {
    galleryList.replaceChildren();
    if (!data.gallery.length)
      galleryList.append(element("p", "snb-muted", "Галерея порожня."));
    data.gallery.forEach((entry, index) => {
      const row = element("div", "snb-gallery-row");
      if (entry.imageUrl) {
        const image = element("img", "snb-gallery-thumb");
        image.src = entry.imageUrl;
        image.alt = entry.imageAlt[language] || "";
        image.style.objectPosition = `50% ${entry.imageFocus}%`;
        row.append(image);
      } else
        row.append(
          element("div", "snb-gallery-placeholder", `Фото №${entry.imageId}`),
        );
      const controls = element("div", "snb-gallery-controls");
      const alt = element("input");
      alt.type = "text";
      alt.maxLength = 180;
      alt.placeholder =
        language === "uk"
          ? "Опис фото українською"
          : "Bildbeschreibung auf Deutsch";
      alt.value = entry.imageAlt[language];
      alt.addEventListener("input", () => {
        entry.imageAlt[language] = alt.value;
        change();
      });
      const crop = element("input");
      crop.type = "range";
      crop.min = "0";
      crop.max = "100";
      crop.value = String(entry.imageFocus);
      crop.setAttribute("aria-label", "Фокус кадру");
      crop.addEventListener("input", () => {
        entry.imageFocus = Number(crop.value);
        row
          .querySelector("img")
          ?.style.setProperty("object-position", `50% ${entry.imageFocus}%`);
        change();
      });
      controls.append(
        element("strong", "", `Фото ${index + 1}`),
        alt,
        crop,
        button("Прибрати з галереї", "button", () => {
          data.gallery.splice(index, 1);
          change();
          renderGallery();
        }),
      );
      row.append(controls);
      galleryList.append(row);
    });
  }
  function fill() {
    for (const name of translatedNames) {
      fields[name].value = data[name][language];
      fields[name].lang = language;
    }
    for (const locale of ["uk", "de"])
      languageButtons[locale].setAttribute(
        "aria-pressed",
        String(locale === language),
      );
    for (const name of [
      "slug",
      "eventStatus",
      "category",
      "archiveType",
      "organizerName",
      "startsAt",
      "endsAt",
      "contactEmail",
      "capacity",
      "seatsAvailable",
      "order",
    ])
      fields[name].value = String(data[name]);
    fields.slug.readOnly = Boolean(selected);
    fillRelations();
    fillMedia();
    renderGallery();
    featured.checked = data.isFeatured;
    focus.value = String(data.imageFocus);
    updatePreview();
  }
  async function hydrateMedia(item) {
    const revision = item?.revision;
    if (data.imageId) {
      try {
        const attachment = await wp.media.attachment(data.imageId).fetch();
        if (selected?.revision === revision && data.imageId === attachment.id) {
          previewImage.src = attachmentUrl(attachment);
          previewImage.hidden = false;
        }
      } catch {
        show("Не вдалося завантажити попередній перегляд обкладинки.", true);
      }
    }
    await Promise.all(
      data.gallery.map(async (entry) => {
        try {
          const attachment = await wp.media.attachment(entry.imageId).fetch();
          if (selected?.revision === revision)
            entry.imageUrl = attachmentUrl(attachment);
        } catch {
          // Keep the attachment number visible when an old thumbnail is unavailable.
        }
      }),
    );
    if (selected?.revision === revision) renderGallery();
  }
  async function open(item, fresh = true) {
    if (busy) return;
    if (
      dirty &&
      !window.confirm("Відкинути незбережені зміни й відкрити іншу подію?")
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
    editorTitle.textContent = item ? "Редагування події" : "Нова подія";
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
    await hydrateMedia(item);
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
      show(
        dirty ? "Список оновлено. Незбережений текст залишився у формі." : "",
      );
    } catch (error) {
      show(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  function payload() {
    const clean = structuredClone(data);
    for (const entry of clean.gallery) delete entry.imageUrl;
    return clean;
  }
  async function write(action, targetRevision) {
    if (busy) return;
    setBusy(true);
    show("Збереження…");
    try {
      const result = await api(selected ? `/${selected.id}` : "", {
        action,
        revision: selected?.revision,
        data: payload(),
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
            ? "Подію знято з публікації."
            : action === "submit"
              ? "Надіслано редактору на перевірку."
              : action === "restore"
                ? "Версію відновлено у чернетку."
                : "Чернетку збережено. Публічна подія не змінена.",
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
  });
  open(null, false);
  load();
})();
