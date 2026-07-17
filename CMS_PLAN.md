# CMS Plan

Проверено по официальной документации 13 июля 2026 года. Тарифы и лимиты нужно повторно проверить непосредственно перед внедрением.

## Сравнение

| Вариант                        | Плюсы                                                                                                 | Минусы                                                                                                                              | Оценка для небольшого Verein                                         |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Sanity                         | Hosted database, Studio, image pipeline, локализованные поля, visual editing; Free — $0 и до 20 seats | Free дает только Administrator/Viewer и public datasets; Growth — $15/seat; custom roles доступны только Enterprise; vendor lock-in | Лучший баланс при одном доверенном редакторе и минимуме эксплуатации |
| Directus                       | Open-source, SQL, no-code Data Studio, granular roles/policies, translations interface                | Self-host требует базу, storage, backups, security и обновления; Cloud-тариф нужно проверять перед выбором                          | Хорошо, если строгие роли важнее минимального обслуживания           |
| Payload CMS                    | Open-source, TypeScript-first, Next.js-native admin, access control и field-level localization        | Нужны production database, постоянное object storage, email, backups и эксплуатация                                                 | Технически сильный, но тяжелее для маленького Verein                 |
| Собственная админка на Next.js | Полный контроль                                                                                       | Дорого, рискованно, долго, нужна auth/security/roles/media                                                                          | Не рекомендуется на этом этапе                                       |

Официальные источники: [Sanity pricing](https://www.sanity.io/pricing), [Sanity roles](https://www.sanity.io/docs/user-guides/roles), [Directus architecture](https://docs.directus.io/getting-started/architecture), [Directus roles](https://docs.directus.io/user-guide/user-management/roles), [Payload deployment](https://payloadcms.com/docs/production/deployment), [Payload localization](https://payloadcms.com/docs/configuration/localization).

## Рекомендация

Рекомендуемый вариант: **Sanity**.

Причины:

- минимум обслуживания;
- понятный редактор для нетехнического администратора;
- hosted media и image transformations;
- бесплатный/недорогой старт;
- роли и права;
- удобная локализация полей;
- хорошая интеграция с Next.js и preview mode;
- меньше эксплуатационной нагрузки, чем Directus/Payload.

Ограничение, важное для бюджета: Free-план подходит только для одного или нескольких полностью доверенных администраторов и read-only viewers. Для безопасной роли Editor/Contributor нужен Growth. Роли только для событий или только для курсов нельзя считать настоящей границей доступа на Free/Growth; custom roles относятся к Enterprise. Если раздельные права `event editor` / `course editor` обязательны, перед реализацией следует повторно сравнить Directus Cloud с эксплуатационной стоимостью self-host.

Риск vendor lock-in снижается тем, что проект имеет собственные TypeScript-модели и data access layer. CMS-ответы нормализуются в текущие типы, поэтому компоненты не зависят от GROQ или Sanity documents.

## Коллекции

- `siteSettings`: название, tagline, контакты, social links, SEO, юридические ссылки.
- `pages`: статические страницы, локализованные title/body/SEO.
- `people`: команда, правление, преподаватели, волонтеры.
- `courses`: курсы, расписание, преподаватели, статус набора.
- `events`: события, архив, регистрационная информация, связи с новостями/курсами.
- `eventRegistrations`: заявки на события, число участников, статус подтверждения/ожидания, согласие и служебная заметка; доступ только организаторам.
- `news`: статьи, объявления, отчеты.
- `partners`: логотипы, описания, ссылки.
- `donations`: способы поддержки, реквизиты, QR, impact copy.
- `media`: изображения, alt, credit, usage.
- `navigation`: порядок и видимость пунктов.

## Роли

- `administrator`: все настройки, публикация, пользователи.
- `editor`: страницы, новости, media, партнеры.
- `event editor`: события и связанные media.
- `registration manager`: список участников, статусы, экспорт CSV; без доступа к остальному контенту.
- `course editor`: курсы, расписание, преподаватели.

Это целевая матрица продукта. В Sanity она внедряется поэтапно: сначала доверенный Administrator; затем Editor/Contributor на Growth. Узкие event/course роли документируются как workflow и не выдаются за security boundary без Enterprise custom roles.

## Миграция

1. Создать Sanity schema на основе `src/types/content.ts`.
2. Импортировать mock-данные как seed.
3. Реализовать адаптер `src/data/sanity.ts`.
4. Оставить публичный контракт функций из `src/data/content.ts`.
5. Добавить preview mode для draft-контента.
6. Настроить image URL builder и alt validation.
7. Добавить webhook на revalidation.
8. Подключить отдельное хранилище регистраций и транзакционную почту: уникальность `event + email`, автоматический waitlist, подтверждение/отмена по ссылке, CSV-экспорт и срок удаления персональных данных. CMS не должна использовать общий почтовый ящик как базу заявок.

## Изображения

Сейчас используются оптимизированные WebP-фотографии из `public/images/generated/` и векторные demo-логотипы из `public/images/partners/`. В CMS каждое изображение должно иметь:

- asset;
- localized alt;
- optional credit;
- aspect ratio или crop;
- usage context.

## Следующий этап

Подключить Sanity Studio, описать схемы, добавить preview, заменить mock data adapter, провести редакторское тестирование с человеком без технических знаний. Регистрации хранить в отдельной защищенной backend-таблице (например, Postgres/Supabase), а не в публичном CMS dataset; перед запуском согласовать retention, privacy notice и права доступа.
