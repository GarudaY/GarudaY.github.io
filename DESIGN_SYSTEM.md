# Design System

## Направление

Визуальный язык спокойный, общественный и надежный: светлый нейтральный фон, темный текст, спокойный синий, теплый желтый акцент и немного зеленого для позитивных состояний. Украинская идентичность проявляется через акценты и контент, а не через агрессивную заливку флагом.

## Цвета

Основные CSS tokens находятся в `src/app/globals.css`:

- `--background: #f2f6f5`
- `--foreground: #162332`
- `--surface: #fffefa`
- `--surface-muted: #e8f0ef`
- `--blue: #245f8f`
- `--blue-strong: #173957`
- `--yellow: #f4c84a`
- `--green: #8daf67`
- `--danger: #a23f33`

Контраст основных комбинаций рассчитан для читаемого текста: темный текст на светлом фоне, белый текст на `blue-strong`, синий текст не используется на темном фоне.

Общий фон — цельный холодный серо-зеленый canvas с двумя очень мягкими радиальными засветками. Полноширинные контентные блоки используют `section-soft`: цвет растворяется к краям и не создает визуальных горизонтальных разрывов.

## Типографика

Используется системный стек:

```css
"Segoe UI", "Noto Sans", Arial, sans-serif
```

Причина: хорошая поддержка украинского, немецкого, латиницы и кириллицы без внешнего font-loading риска.

## Layout

- контейнеры: `max-w-7xl`, `max-w-4xl` для узкого текста;
- секции: 56-96 px вертикального ритма;
- карточки: radius 8 px;
- интерактивные зоны: минимум 44 px высоты;
- mobile-first сетки с отдельной логикой для фильтров и CTA.

## Компоненты

Базовые:

- `Button`, `LinkButton`
- `Badge`
- `Card`
- `Container`
- `Section`
- `PageHeader`
- `Breadcrumbs`
- `MobileActionBar`
- `FormField`
- `Alert`
- `EmptyState`
- `Skeleton`
- `ContentImage`

Контентные:

- `CourseCard`
- `EventCard`
- `EventDateBadge`
- `NewsCard`
- `PersonCard`
- `PeopleCarousel` — горизонтальные фото-профили, scroll snap, свайп на mobile и кнопки на desktop
- `DonationMethodCard`
- `PartnerLogo`
- `FeaturedContentList`
- `ImageGallery`
- `StatsSection`
- `CTASection`
- `ContactCard`
- `EventRegistrationForm` — структурированная заявка на событие и demo-подтверждение

## Состояния

- focus: общий `.focus-ring`;
- active navigation: `aria-current` и темная заливка;
- empty states: `EmptyState`;
- demo/legal warning: `Alert`;
- disabled/closed content: status badges.

## Responsive principles

- 320 px: одноколоночный layout, крупные touch targets, фильтры в несколько рядов.
- 768 px: карточки переходят в 2 колонки.
- 1024 px+: sticky summary на деталях курса/подии.
- длинные немецкие строки держатся внутри контейнеров через гибкие сетки, переносы и отсутствие фиксированных текстовых ширин.
