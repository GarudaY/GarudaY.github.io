# Content Model

Модели определены в `src/types/content.ts`. Публикуемые контентные сущности (`Person`, `Course`, `Event`, `NewsArticle`) имеют ID, slug, status, timestamps, SEO и локализуемые поля. Глобальные настройки и справочные сущности используют только применимые общие поля.

## Shared

- `LocalizedString`: минимум `uk`, опционально другие локали.
- `LocalizedList`: список строк с fallback на `uk`.
- `LocalizedRichText`: безопасная v1-модель упорядоченных абзацев; CMS-адаптер позже может преобразовать portable blocks, не отдавая произвольный HTML в UI.
- `ImageAsset`: `src`, localized `alt`, optional width/height/credit.
- `SEOData`: localized title/description, optional image/noIndex.

## SiteSettings

Поля: `id`, `name`, `tagline`, `description`, `contact`, `navigation`, `legalLinks`, `socialLinks`, `stats`, `seo`.

Связи: глобально используется в layout, footer, home.

## Person

Поля: `id`, `slug`, `status`, `name`, `roleLabel`, `roles`, `bio`, `languages`, `image`, `email`, `socialLinks`, `relatedCourseIds`, `order`, `isDemo`, `seo`, `createdAt`, `updatedAt`.

Связи:

- `relatedCourseIds`
- `Course.teacherIds`

Обязательные: `id`, `slug`, `status`, `name.uk`, `roleLabel.uk`, `roles`, `bio.uk`, `image.alt.uk`.

## Course

Поля: `id`, `slug`, `status`, `enrollmentStatus`, `category`, `title`, `summary`, `description`, `outcomes`, `materials`, `ageGroup`, `language`, `format`, `location`, `schedule`, `price`, `startsAt`, `duration`, `seatsTotal`, `seatsAvailable`, `teacherIds`, `relatedCourseIds`, `image`, `isFeatured`, `order`, `seo`, timestamps.

Связи:

- `teacherIds -> Person`
- `relatedCourseIds -> Course`

SEO: title/description/image.

## Event

Поля: `id`, `slug`, `status`, `eventStatus`, `category`, `title`, `summary`, `description`, `startsAt`, `endsAt`, `location`, `price`, `registrationLabel`, `capacity`, `seatsAvailable`, `contactEmail`, `image`, `gallery`, `relatedArticleIds`, `relatedCourseIds`, `isFeatured`, `seo`, timestamps.

Связи:

- `relatedArticleIds -> NewsArticle`
- `relatedCourseIds -> Course`

SEO/structured data: Event schema.

Локальная backend-модель `EventRegistration`: `eventId`, `reference`, `name`, `email`, `participants`, `group`, `note`, `status` (`confirmed`, `waitlist`, `cancelled`), `consentAt`, timestamps и приватный cancellation token. Публичная форма не отправляет свободный текст в общий inbox: она создаёт структурированную запись, проверяет остаток мест, автоматически ведёт waitlist и возвращает подтверждение в интерфейсе. Без внешнего почтового сервиса данные сохраняются в локальном исключённом из Git хранилище; production-адаптер может заменить его транзакционной БД без изменения UI-контракта.

## NewsArticle

Поля: `id`, `slug`, `status`, `title`, `excerpt`, `body`, `publishedAt`, `author`, `image`, `relatedEventIds`, `relatedCourseIds`, `isFeatured`, `seo`, timestamps.

Связи:

- `relatedEventIds -> Event`
- `relatedCourseIds -> Course`

SEO/structured data: Article schema.

## Partner

Поля: `id`, `name`, `status`, `description`, `website`, `logo`, `order`.

Обязательные: `id`, `name`, `status`, `description.uk`, `logo.alt.uk`.

## DonationSettings / DonationMethod

`DonationSettings`: `title`, `description`, `impact`, `methods`, `seo`.

`DonationMethod`: `id`, `type`, `title`, `description`, `details`, `isDemo`.

Реальные банковские данные и QR не входят в mock. Их нужно добавить только после юридической и финансовой проверки.

## FeaturedContent

Поля: `id`, `type`, `title`, `summary`, `hrefRoute`, `slug`, `badge`.

Используется на главной для ближайшего события, открытого курса и donation initiative.

## NavigationItem

Поля: `label`, `route`, `priority`.

Навигация централизована в `siteSettings`, чтобы CMS могла менять порядок и видимость без изменений в Header.
