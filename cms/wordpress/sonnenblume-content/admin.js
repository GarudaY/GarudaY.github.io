/* global wp */
(() => {
  "use strict";
  const config = window.SNB_CONTENT;
  const root = document.getElementById("snb-app");
  if (!root || !config) return;
  const people = config.collection === "people";
  const titleField = people ? "name" : "title";
  const categoryField = people ? "roleLabel" : "status";
  const textField = people ? "bio" : "text";
  let items = [];
  let selected = null;
  let dirty = false;
  let busy = false;
  let language = "uk";
  let view = "active";
  let mediaFrame;
  const fields = {};
  const defaults = () =>
    people
      ? {
          slug: "",
          name: { uk: "", de: "" },
          roleLabel: { uk: "", de: "" },
          bio: { uk: "", de: "" },
          teacherRoleLabel: { uk: "", de: "" },
          teacherBio: { uk: "", de: "" },
          roles: ["volunteer"],
          boardPosition: null,
          languages: [],
          publicationPermission: false,
          imageAlt: { uk: "", de: "" },
          order: 10,
          imageId: 0,
          imageFocus: 50,
        }
      : {
          title: { uk: "", de: "" },
          status: { uk: "", de: "" },
          text: { uk: "", de: "" },
          imageAlt: { uk: "", de: "" },
          icon: "handshake",
          order: 10,
          imageId: 0,
          imageFocus: 50,
          isExample: false,
        };
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
  const header = element("header", "snb-header");
  const heading = element("div");
  heading.append(
    element("p", "snb-eyebrow", "SONNENBLUME · Керування контентом"),
    element("h1", "", people ? "Люди спільноти" : "Новини спільноти"),
    element(
      "p",
      "snb-muted",
      people
        ? "Правління, викладачі та активні волонтери — зокрема люди, які не є членами об’єднання."
        : "Тут редагуються новини на головній сторінці, українською та німецькою.",
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
  const notice = element("div", "snb-notice");
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  const layout = element("div", "snb-layout");
  const sidebar = element("aside", "snb-sidebar");
  const tools = element("div", "snb-list-tools");
  const refresh = button("Оновити список", "button", () => load());
  tools.append(
    button(
      people ? "+ Новий профіль" : "+ Нова новина",
      "button button-primary",
      () => open(null),
    ),
    refresh,
  );
  const list = element("div", "snb-list");
  const filters = element("div", "snb-filters");
  filters.setAttribute("role", "group");
  filters.setAttribute(
    "aria-label",
    people ? "Статус профілів у списку" : "Статус новин у списку",
  );
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
  sidebar.append(tools, filters, list);
  const editor = element("section", "snb-editor");
  editor.setAttribute(
    "aria-label",
    people ? "Редагування профілю" : "Редагування новини",
  );
  const editorTitle = element("h2", "", "Нова новина");
  const status = element("p", "snb-muted", "Чернетка · ще не збережено");
  const tabs = element("div", "snb-tabs");
  tabs.setAttribute("role", "group");
  tabs.setAttribute("aria-label", "Мова тексту");
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
  function field(name, label, multiline, max) {
    const wrap = element("label", "snb-field");
    const input = element(multiline ? "textarea" : "input");
    if (!multiline) input.type = "text";
    input.maxLength = max;
    input.id = `snb-${name}`;
    if (multiline) input.rows = 6;
    input.addEventListener("input", () => {
      data[name][language] = input.value;
      change();
    });
    fields[name] = input;
    wrap.append(element("span", "", label), input);
    form.append(wrap);
  }
  field(
    titleField,
    people ? "Ім’я · до 120 символів" : "Заголовок · до 160 символів",
    false,
    people ? 120 : 160,
  );
  field(
    categoryField,
    people
      ? "Роль у спільноті / правлінні"
      : "Коротка категорія · наприклад «Готуємо проєкт»",
    false,
    people ? 160 : 70,
  );
  field(
    textField,
    people
      ? "Біографія · тільки перевірені відомості"
      : "Текст новини · до 1800 символів",
    true,
    people ? 8000 : 1800,
  );
  const slug = element("input");
  const boardPosition = element("select");
  const roleInputs = {};
  const languages = element("input");
  const linkedCourses = element("p", "snb-muted");
  const teacherFields = element("div");
  if (people) {
    const slugLabel = element("label", "snb-field");
    slug.type = "text";
    slug.maxLength = 70;
    slug.pattern = "[a-z0-9]+(-[a-z0-9]+)*";
    slug.id = "snb-slug";
    slug.addEventListener("input", () => {
      data.slug = slug.value;
      change();
    });
    slugLabel.append(
      element(
        "span",
        "",
        "Адреса профілю · латиницею, після збереження незмінна",
      ),
      slug,
    );
    form.append(slugLabel);
    const rolesLabel = element("fieldset", "snb-role-options");
    rolesLabel.append(
      element("legend", "", "Де показувати людину · можна декілька ролей"),
    );
    for (const [value, label] of [
      ["board", "Правління"],
      ["team", "Команда"],
      ["teacher", "Викладач"],
      ["volunteer", "Активний волонтер · членство не обов’язкове"],
    ]) {
      const wrap = element("label", "snb-checkbox");
      const input = element("input");
      input.type = "checkbox";
      input.id = `snb-role-${value}`;
      input.addEventListener("change", () => {
        data.roles = Object.entries(roleInputs)
          .filter(([, node]) => node.checked)
          .map(([role]) => role);
        data.boardPosition = data.roles.includes("board")
          ? data.boardPosition || "member"
          : null;
        change();
        fillPeople();
      });
      roleInputs[value] = input;
      wrap.append(input, element("span", "", label));
      rolesLabel.append(wrap);
    }
    const positionLabel = element("label", "snb-field");
    boardPosition.id = "snb-boardPosition";
    for (const [value, label] of [
      ["member", "Член правління"],
      ["chair", "Голова · верхівка піраміди"],
    ]) {
      const option = element("option", "", label);
      option.value = value;
      boardPosition.append(option);
    }
    boardPosition.addEventListener("change", () => {
      data.boardPosition = boardPosition.value;
      change();
    });
    positionLabel.append(
      element("span", "", "Місце у піраміді правління"),
      boardPosition,
    );
    form.append(rolesLabel, positionLabel);
    field(
      "teacherRoleLabel",
      "Викладацька роль · що саме викладає",
      false,
      160,
    );
    field(
      "teacherBio",
      "Окремий короткий опис для картки викладача",
      true,
      3000,
    );
    teacherFields.append(
      fields.teacherRoleLabel.parentElement,
      fields.teacherBio.parentElement,
    );
    form.append(teacherFields);
    const languageLabel = element("label", "snb-field");
    languages.type = "text";
    languages.id = "snb-languages";
    languages.addEventListener("input", () => {
      data.languages = languages.value
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
      change();
    });
    languageLabel.append(
      element("span", "", "Мови · коди через кому, наприклад uk, de, en"),
      languages,
    );
    form.append(languageLabel, linkedCourses);
  }
  const options = element("div", "snb-options");
  const iconLabel = element("label", "snb-field");
  const icon = element("select");
  for (const [value, label] of [
    ["handshake", "Співпраця"],
    ["lightbulb", "Новий проєкт"],
    ["users", "Команда"],
  ]) {
    const option = element("option", "", label);
    option.value = value;
    icon.append(option);
  }
  icon.addEventListener("change", () => {
    data.icon = icon.value;
    change();
  });
  iconLabel.append(element("span", "", "Піктограма"), icon);
  const orderLabel = element("label", "snb-field");
  const order = element("input");
  order.type = "number";
  order.min = "0";
  order.max = "999";
  order.step = "1";
  order.addEventListener("input", () => {
    data.order = Number(order.value);
    change();
  });
  orderLabel.append(element("span", "", "Порядок · менше число вище"), order);
  if (!people) options.append(iconLabel);
  options.append(orderLabel);
  form.append(options);
  const media = element("div", "snb-media");
  const imageStatus = element(
    "p",
    "snb-muted",
    "Без фотографії — показуватиметься піктограма.",
  );
  const chooseImage = button("Обрати / завантажити фото", "button", () => {
    if (!mediaFrame) {
      mediaFrame = wp.media({
        title: people ? "Фотографія людини" : "Зображення новини",
        button: { text: "Використати фото" },
        library: { type: "image" },
        multiple: false,
      });
      mediaFrame.on("select", () => {
        const attachment = mediaFrame.state().get("selection").first().toJSON();
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
  });
  const removeImage = button("Прибрати фото", "button", () => {
    data.imageId = 0;
    previewImage.hidden = true;
    previewImage.removeAttribute("src");
    change();
    fillMedia();
  });
  media.append(imageStatus, chooseImage, removeImage);
  form.append(media);
  field("imageAlt", "Опис фотографії для людей, які її не бачать", false, 180);
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
  const exampleLabel = element("label", "snb-checkbox");
  const example = element("input");
  example.type = "checkbox";
  example.id = "snb-publicationPermission";
  example.addEventListener("change", () => {
    if (people) data.publicationPermission = example.checked;
    else data.isExample = example.checked;
    change();
  });
  exampleLabel.append(
    example,
    element(
      "span",
      "",
      people
        ? "Підтверджую, що маю дозвіл опублікувати ці відомості та фотографію. Не додаю приватні контакти."
        : "Це демонстраційний приклад, а не справжня новина",
    ),
  );
  form.append(exampleLabel);
  const actions = element("div", "snb-actions");
  const save = button("Зберегти чернетку", "button", () => write("save"));
  const submit = button("На перевірку", "button", () => write("submit"));
  const publish = button("Опублікувати", "button button-primary", () =>
    write("publish"),
  );
  const archive = button("Зняти з публікації", "button snb-danger", () => {
    if (dirty) {
      show("Спочатку збережіть або відкиньте незбережені зміни.", true);
      return;
    }
    if (
      window.confirm(
        people
          ? "Профіль зникне з сайту. Історія залишиться. Викладача з пов’язаними курсами спочатку потрібно замінити в даних курсів. Продовжити?"
          : "Новина зникне з головної сторінки. Текст та історія залишаться. Продовжити?",
      )
    )
      write("archive");
  });
  actions.append(save, submit);
  if (config.canPublish) actions.append(publish, archive);
  const workflowHint = element(
    "p",
    "snb-muted",
    "Чернетка не змінює текст на сайті. Для публікації потрібні обидві мови та схвалення редактора.",
  );
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
    workflowHint,
    history,
  );
  const preview = element("aside", "snb-preview");
  preview.append(
    element("p", "snb-eyebrow", "Попередній перегляд · обрана мова"),
  );
  const card = element("article", "snb-preview-card");
  const previewImage = element("img", "snb-preview-image");
  previewImage.hidden = true;
  const previewIcon = element("span", "snb-preview-icon", "↔");
  previewIcon.setAttribute("aria-hidden", "true");
  const previewStatus = element("p", "snb-preview-status");
  const previewTitle = element("h3");
  const previewText = element("p", "snb-preview-text");
  card.append(
    previewImage,
    previewIcon,
    previewStatus,
    previewTitle,
    previewText,
  );
  preview.append(
    card,
    element(
      "p",
      "snb-muted",
      "Це чернетка. Публічний сайт показує останню схвалену версію. Ширина й переноси залежать від екрана.",
    ),
  );
  layout.append(sidebar, editor, preview);
  const navigation = element("nav", "snb-collections");
  navigation.setAttribute("aria-label", "Розділи контенту");
  for (const [page, label, active] of [
    ["sonnenblume-content", "Новини", !people],
    ["sonnenblume-people", "Люди", people],
    ["sonnenblume-courses", "Курси", false],
    ["sonnenblume-events", "Події", false],
    ["sonnenblume-volunteer", "Волонтерство", false],
    ["sonnenblume-partners", "Партнери", false],
  ]) {
    const link = element("a", "snb-tab", label);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("page", page);
    link.href = url.href;
    if (active) link.setAttribute("aria-current", "page");
    navigation.append(link);
  }
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
      list.append(
        element(
          "p",
          "snb-muted",
          items.length
            ? people
              ? "У цьому списку немає профілів."
              : "У цьому списку немає новин."
            : people
              ? "Профілів ще немає. Додайте перший."
              : "Новин ще немає. Створіть першу.",
        ),
      );
    for (const item of visible) {
      const row = button(
        "",
        `snb-list-item${selected?.id === item.id ? " is-selected" : ""}`,
        () => open(item),
      );
      row.append(
        element(
          "strong",
          "",
          item.data[titleField].uk || item.data[titleField].de,
        ),
        element("span", "", stateLabel(item)),
        element("small", "", item.authorName),
      );
      list.append(row);
    }
  }
  function updatePreview() {
    previewTitle.textContent =
      data[titleField][language] ||
      (people ? "Ім’я людини" : "Заголовок новини");
    previewStatus.textContent = data[categoryField][language] || "Категорія";
    previewText.textContent =
      data[textField][language] || "Тут з’явиться ваш текст…";
    previewIcon.textContent = people
      ? "◎"
      : { handshake: "↔", lightbulb: "✦", users: "◎" }[data.icon];
    previewIcon.hidden = Boolean(data.imageId);
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
      : "Без фотографії — показуватиметься піктограма.";
    removeImage.hidden = !data.imageId;
    fields.imageAlt.parentElement.hidden = !data.imageId;
    focusLabel.hidden = !data.imageId;
  }
  function fillPeople() {
    if (!people) return;
    slug.value = data.slug;
    slug.readOnly = Boolean(selected);
    for (const [role, input] of Object.entries(roleInputs))
      input.checked = data.roles.includes(role);
    boardPosition.value = data.boardPosition || "member";
    boardPosition.parentElement.hidden = !data.roles.includes("board");
    teacherFields.hidden = !data.roles.includes("teacher");
    if (document.activeElement !== languages)
      languages.value = data.languages.join(", ");
    linkedCourses.textContent = data.relatedCourseIds?.length
      ? "Пов’язані курси: " +
        data.relatedCourseIds.join(", ") +
        ". Зв’язки захищені від змін у профілі."
      : "Пов’язаних курсів поки немає. Курси прив’язуються в даних курсів, а не в профілі.";
  }
  function fill() {
    for (const name of people
      ? [
          "name",
          "roleLabel",
          "bio",
          "teacherRoleLabel",
          "teacherBio",
          "imageAlt",
        ]
      : ["title", "status", "text", "imageAlt"]) {
      fields[name].value = data[name][language];
      fields[name].lang = language;
    }
    for (const locale of ["uk", "de"])
      languageButtons[locale].setAttribute(
        "aria-pressed",
        String(locale === language),
      );
    icon.value = data.icon;
    order.value = String(data.order);
    focus.value = String(data.imageFocus);
    example.checked = people ? data.publicationPermission : data.isExample;
    fillPeople();
    fillMedia();
    updatePreview();
  }
  async function open(item, fresh = true) {
    if (busy) return;
    if (
      dirty &&
      !window.confirm(
        people
          ? "Відкинути незбережені зміни й відкрити інший профіль?"
          : "Відкинути незбережені зміни й відкрити іншу новину?",
      )
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
    editorTitle.textContent = people
      ? item
        ? "Редагування профілю"
        : "Новий профіль"
      : item
        ? "Редагування новини"
        : "Нова новина";
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
          button("Відновити у чернетку", "button", () => {
            if (dirty && !window.confirm("Відкинути незбережені зміни?"))
              return;
            write("restore", entry.revision);
          }),
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
        show("Не вдалося завантажити попередній перегляд фотографії.", true);
      }
    }
  }
  async function api(path = "", body) {
    const url = new URL(config.api);
    // rest_url uses ?rest_route= on hosts without pretty permalinks.
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
        "Немає відповіді сервера. Ваш текст залишився у формі. Перед повторним збереженням оновіть список і перевірте, чи запис уже зберігся.",
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
          : result.message || "Не вдалося зберегти. Спробуйте пізніше.",
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
        {
          save: "Чернетку збережено. Публічний текст не змінено.",
          submit: "Надіслано редактору на перевірку.",
          publish:
            "Опубліковано. На серверній версії сайту зміни з’являться після оновлення кешу (до хвилини); GitHub Pages потребує нової збірки.",
          archive: people
            ? "Профіль знято з публікації."
            : "Новину знято з публікації.",
          restore:
            "Версію відновлено у чернетку. Перевірте текст перед публікацією.",
        }[action],
      );
    } catch (error) {
      show(error.message, true);
    } finally {
      setBusy(false);
    }
  }
  window.addEventListener("beforeunload", (event) => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  fill();
  load();
})();
