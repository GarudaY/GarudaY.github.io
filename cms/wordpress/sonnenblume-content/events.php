<?php
defined('ABSPATH') || exit;

final class Sonnenblume_Events extends Sonnenblume_Content {
    const TYPE = 'snb_event';
    const COLLECTION = 'events';
    const LABEL = 'Події SONNENBLUME';
    const EDIT = 'snb_edit_events';
    const EDIT_OTHERS = 'snb_edit_others_events';
    const PUBLISH = 'snb_publish_events';
    const MAX_BODY = 260000;

    protected static function content_id($slug) {
        $legacy = [
            'tantsi-dlia-doroslykh-2025' => 'event-adult-dance-2025',
            'zustrich-fakhivtsiv-okhorony-zdorovia-2025' => 'event-healthcare-networking-2025',
            'den-nezalezhnosti-ukrainy-2026' => 'event-independence-day-2026',
            'ai-instrumenty-u-volonterstvi-2026' => 'event-ai-volunteering-workshop-2026',
            'mizhnarodnyi-den-zakhystu-ditei-2025' => 'event-children-day-2025',
            'muzychna-zustrich-2025' => 'event-music-meeting-2025',
        ];
        return $legacy[$slug] ?? 'event-' . $slug;
    }

    public static function menu() {
        add_submenu_page('sonnenblume-content', 'Події — SONNENBLUME', 'Події', static::EDIT, 'sonnenblume-events', [static::class, 'page']);
    }

    protected static function translated($input, $name, $max, $publishing, $required = true, $multiline = false) {
        if (isset($input[$name]) && !is_array($input[$name])) return new WP_Error('snb_validation', "Поле $name має містити переклади.", ['status' => 400]);
        $value = [];
        foreach (['uk', 'de'] as $locale) {
            $value[$locale] = static::field($input[$name][$locale] ?? '', $max, $multiline);
            if ($value[$locale] === null || ($publishing && $required && !$value[$locale])) return new WP_Error('snb_validation', "Перевірте $name ($locale). Для публікації потрібні обидві мови.", ['status' => 400]);
        }
        return $value;
    }

    protected static function valid_datetime($value, $required) {
        if (!is_string($value) || (!$value && $required)) return false;
        if (!$value) return true;
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) {
            $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
            $errors = DateTimeImmutable::getLastErrors();
            return $date && (!$errors || (!$errors['warning_count'] && !$errors['error_count'])) && $date->format('Y-m-d') === $value;
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/D', $value)) return false;
        try { new DateTimeImmutable($value); return true; } catch (Exception $error) { return false; }
    }

    protected static function media($input, $publishing, $label) {
        if (!is_array($input)) return new WP_Error('snb_validation', "Перевірте $label.", ['status' => 400]);
        $imageId = $input['imageId'] ?? 0;
        if (!is_int($imageId) || $imageId < 1) return new WP_Error('snb_validation', "Оберіть $label з медіатеки.", ['status' => 400]);
        $attachment = get_post($imageId);
        if (!$attachment || $attachment->post_type !== 'attachment' || !in_array(get_post_mime_type($imageId), ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], true)) return new WP_Error('snb_validation', "$label має бути JPEG, PNG, WebP або AVIF.", ['status' => 400]);
        if (!current_user_can(static::EDIT_OTHERS) && (int) $attachment->post_author !== get_current_user_id()) return new WP_Error('snb_forbidden_media', 'Автор може використовувати лише власні завантаження.', ['status' => 403]);
        $alt = static::translated($input, 'imageAlt', 180, $publishing, true);
        if (is_wp_error($alt)) return $alt;
        $focus = $input['imageFocus'] ?? 50;
        if (!is_int($focus) || $focus < 0 || $focus > 100) return new WP_Error('snb_validation', "Фокус $label має бути від 0 до 100.", ['status' => 400]);
        return ['imageId' => $imageId, 'imageAlt' => $alt, 'imageFocus' => $focus];
    }

    protected static function clean_data($input, $publishing) {
        if (!is_array($input)) return new WP_Error('snb_validation', 'Очікуються дані події.', ['status' => 400]);
        $common = parent::clean_data(array_merge($input, [
            'title' => $input['title'] ?? [], 'text' => ['uk' => 'Event', 'de' => 'Event'],
            'status' => ['uk' => 'Event', 'de' => 'Event'], 'icon' => 'users', 'isExample' => false,
        ]), $publishing);
        if (is_wp_error($common)) return $common;
        $data = array_intersect_key($common, array_flip(['order', 'imageId', 'imageAlt', 'imageFocus']));
        $slug = $input['slug'] ?? '';
        if (!is_string($slug) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 90) return new WP_Error('snb_validation', 'Адреса події: латинські малі літери, цифри й дефіси, до 90 символів.', ['status' => 400]);
        $data['slug'] = $slug; $data['contentId'] = static::content_id($slug);
        foreach (['title' => [180, true, false], 'summary' => [600, true, true], 'description' => [10000, true, true], 'location' => [400, true, false], 'price' => [300, true, false], 'registrationLabel' => [180, true, false], 'dateLabel' => [180, false, false], 'timeLabel' => [180, false, false]] as $name => $settings) {
            $value = static::translated($input, $name, $settings[0], $publishing, $settings[1], $settings[2]);
            if (is_wp_error($value)) return $value; $data[$name] = $value;
        }
        foreach (['dateLabel', 'timeLabel'] as $name) {
            if ($publishing && (bool) $data[$name]['uk'] !== (bool) $data[$name]['de']) return new WP_Error('snb_validation', "Для $name потрібні обидві мови або жодна.", ['status' => 400]);
        }
        if (!$data['title']['uk'] && !$data['title']['de']) return new WP_Error('snb_validation', 'Додайте назву хоча б однією мовою.', ['status' => 400]);
        if (!in_array($input['category'] ?? '', ['community', 'culture', 'children', 'integration', 'charity'], true)) return new WP_Error('snb_validation', 'Оберіть категорію події.', ['status' => 400]);
        if (!in_array($input['eventStatus'] ?? '', ['upcoming', 'past', 'cancelled'], true)) return new WP_Error('snb_validation', 'Оберіть статус події.', ['status' => 400]);
        if (!in_array($input['archiveType'] ?? '', ['', 'announcement'], true)) return new WP_Error('snb_validation', 'Неправильний тип архівного матеріалу.', ['status' => 400]);
        $data['category'] = $input['category']; $data['eventStatus'] = $input['eventStatus']; $data['archiveType'] = $input['archiveType'];
        $organizer = static::field($input['organizerName'] ?? '', 180);
        if ($organizer === null) return new WP_Error('snb_validation', 'Перевірте назву організатора.', ['status' => 400]);
        $data['organizerName'] = $organizer;
        $startsAt = $input['startsAt'] ?? ''; $endsAt = $input['endsAt'] ?? '';
        if (!static::valid_datetime($startsAt, $publishing) || !static::valid_datetime($endsAt, false)) return new WP_Error('snb_validation', 'Дата: YYYY-MM-DD або точний ISO-час із часовим поясом.', ['status' => 400]);
        if ($endsAt && strtotime($endsAt) < strtotime($startsAt)) return new WP_Error('snb_validation', 'Завершення події не може бути раніше початку.', ['status' => 400]);
        $data['startsAt'] = $startsAt; $data['endsAt'] = $endsAt;
        if (!is_string($input['contactEmail'] ?? '')) return new WP_Error('snb_validation', 'Перевірте контактний email.', ['status' => 400]);
        $email = sanitize_email($input['contactEmail']);
        if (($publishing && !$email) || ($email && !is_email($email))) return new WP_Error('snb_validation', 'Перевірте контактний email.', ['status' => 400]);
        $data['contactEmail'] = $email;
        if (!is_bool($input['isFeatured'] ?? null)) return new WP_Error('snb_validation', 'Позначка рекомендованої події неправильна.', ['status' => 400]);
        $data['isFeatured'] = $input['isFeatured'];
        $relations = $input['relatedCourseIds'] ?? null;
        if (!is_array($relations) || !array_is_list($relations) || count($relations) > 20 || count(array_unique($relations, SORT_REGULAR)) !== count($relations)) return new WP_Error('snb_validation', 'Перевірте пов’язані курси.', ['status' => 400]);
        foreach ($relations as $related) if (!is_string($related) || !preg_match('/^course-[a-z0-9]+(?:-[a-z0-9]+)*$/D', $related)) return new WP_Error('snb_validation', 'Неправильний ID пов’язаного курсу.', ['status' => 400]);
        $data['relatedCourseIds'] = $relations; $data['relatedArticleIds'] = [];
        $gallery = $input['gallery'] ?? null;
        if (!is_array($gallery) || !array_is_list($gallery) || count($gallery) > 12) return new WP_Error('snb_validation', 'Галерея може містити до 12 фотографій.', ['status' => 400]);
        $data['gallery'] = [];
        $seen = [];
        foreach ($gallery as $entry) {
            $clean = static::media($entry, $publishing, 'фото галереї');
            if (is_wp_error($clean)) return $clean;
            if (isset($seen[$clean['imageId']])) return new WP_Error('snb_validation', 'Одне фото не можна двічі додати до галереї.', ['status' => 400]);
            $seen[$clean['imageId']] = true; $data['gallery'][] = $clean;
        }
        if ($publishing && !$data['imageId']) return new WP_Error('snb_validation', 'Для публікації події потрібна обкладинка.', ['status' => 400]);
        $data['capacity'] = 0; $data['seatsAvailable'] = 0;
        return $data;
    }

    protected static function records() {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare("SELECT p.ID, m.meta_value FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s WHERE p.post_type = %s AND p.post_status = 'draft' ORDER BY p.ID LIMIT 201", static::META, static::TYPE));
    }

    protected static function published_course_ids() {
        global $wpdb;
        $rows = $wpdb->get_results($wpdb->prepare("SELECT m.meta_value FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s WHERE p.post_type = %s AND p.post_status = 'draft' LIMIT 200", static::META, Sonnenblume_Courses::TYPE));
        $ids = [];
        foreach ($rows as $row) { $state = json_decode($row->meta_value, true); $course = $state['live'] ?? null; if ($course && !$state['archived']) $ids[] = $course['contentId']; }
        return array_fill_keys($ids, true);
    }

    protected static function prepare_data($data, $state, $id, $action) {
        $previous = $state['working'];
        if ($previous && $data['slug'] !== $previous['slug']) return new WP_Error('snb_immutable_slug', 'Адресу збереженої події не можна змінювати.', ['status' => 409]);
        foreach (static::records() as $record) {
            if ((int) $record->ID === $id) continue;
            $other = json_decode($record->meta_value, true);
            if (($other['working']['slug'] ?? null) === $data['slug']) return new WP_Error('snb_duplicate_slug', 'Ця адреса вже закріплена за іншою подією, навіть якщо вона в архіві.', ['status' => 409]);
            if (($other['working']['contentId'] ?? null) === $data['contentId']) return new WP_Error('snb_duplicate_id', 'Внутрішній ID події вже використовується.', ['status' => 409]);
        }
        if ($action === 'publish') {
            $courseIds = static::published_course_ids();
            foreach ($data['relatedCourseIds'] as $related) if (!isset($courseIds[$related])) return new WP_Error('snb_missing_course', 'Один із пов’язаних курсів не опублікований.', ['status' => 409]);
        }
        return $data;
    }

    public static function course_options() {
        global $wpdb;
        $rows = $wpdb->get_results($wpdb->prepare("SELECT m.meta_value FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s WHERE p.post_type = %s AND p.post_status = 'draft' LIMIT 200", static::META, Sonnenblume_Courses::TYPE));
        $items = [];
        foreach ($rows as $row) { $state = json_decode($row->meta_value, true); $course = $state['live'] ?? null; if (!$course || $state['archived']) continue; $items[] = ['id' => $course['contentId'], 'title' => $course['title']]; }
        usort($items, fn($a, $b) => strcmp($a['id'], $b['id']));
        return $items;
    }

    protected static function public_media($entry) {
        $url = wp_get_attachment_image_url($entry['imageId'], 'large');
        return $url ? ['url' => $url, 'alt' => $entry['imageAlt'], 'focus' => $entry['imageFocus']] : null;
    }

    public static function public_updates() {
        $items = []; $courseIds = static::published_course_ids();
        foreach (static::records() as $record) {
            $state = json_decode($record->meta_value, true); $data = $state['live'] ?? null;
            if (!$data || $state['archived']) continue;
            $image = static::public_media(['imageId' => $data['imageId'], 'imageAlt' => $data['imageAlt'], 'imageFocus' => $data['imageFocus']]);
            if (!$image) continue;
            $public = array_diff_key($data, array_flip(['contentId', 'imageId', 'imageAlt', 'imageFocus']));
            if (!$public['archiveType']) unset($public['archiveType']);
            if (!$public['organizerName']) unset($public['organizerName']);
            if (!$public['endsAt']) unset($public['endsAt']);
            foreach (['dateLabel', 'timeLabel'] as $name) if (!$public[$name]['uk'] && !$public[$name]['de']) unset($public[$name]);
            $public['id'] = $data['contentId']; $public['createdAt'] = $state['createdAt'] ?? $state['updatedAt']; $public['updatedAt'] = $state['publishedAt']; $public['image'] = $image;
            $public['gallery'] = [];
            foreach ($data['gallery'] as $entry) { $media = static::public_media($entry); if ($media) $public['gallery'][] = $media; }
            $public['relatedCourseIds'] = array_values(array_filter($data['relatedCourseIds'], fn($id) => isset($courseIds[$id])));
            $items[] = $public;
        }
        usort($items, fn($a, $b) => strcmp($a['startsAt'], $b['startsAt']) ?: strcmp($a['id'], $b['id']));
        return new WP_REST_Response(['schemaVersion' => 1, 'items' => $items], 200, ['Cache-Control' => 'public, max-age=0, must-revalidate']);
    }
}
