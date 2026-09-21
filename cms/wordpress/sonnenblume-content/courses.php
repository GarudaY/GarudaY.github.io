<?php
defined('ABSPATH') || exit;

final class Sonnenblume_Courses extends Sonnenblume_Content {
    const TYPE = 'snb_course';
    const COLLECTION = 'courses';
    const LABEL = 'Курси SONNENBLUME';
    const EDIT = 'snb_edit_courses';
    const EDIT_OTHERS = 'snb_edit_others_courses';
    const PUBLISH = 'snb_publish_courses';
    const MAX_BODY = 160000;

    protected static function content_id($slug) {
        $legacy = [
            'kurs-nimetskoi-movy' => 'course-german',
            'maliuvannia-daniil-babych' => 'course-painting-daniil',
            'khoreohrafiia-studiia-mriya' => 'course-choreography-mriya',
            'khor-sonnenblume' => 'course-choir',
        ];
        return $legacy[$slug] ?? 'course-' . $slug;
    }

    public static function menu() {
        add_submenu_page('sonnenblume-content', 'Курси — SONNENBLUME', 'Курси', static::EDIT, 'sonnenblume-courses', [static::class, 'page']);
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

    protected static function translated_list($input, $name, $publishing, $required) {
        if (!is_array($input[$name] ?? null)) return new WP_Error('snb_validation', "Перевірте список $name.", ['status' => 400]);
        $result = [];
        foreach (['uk', 'de'] as $locale) {
            $items = $input[$name][$locale] ?? null;
            if (!is_array($items) || !array_is_list($items) || count($items) > 12 || ($publishing && $required && !$items)) return new WP_Error('snb_validation', "Перевірте список $name ($locale).", ['status' => 400]);
            $result[$locale] = [];
            foreach ($items as $item) {
                $clean = static::field($item, 300, false);
                if ($clean === null || !$clean) return new WP_Error('snb_validation', "Порожній або задовгий пункт у $name ($locale).", ['status' => 400]);
                $result[$locale][] = $clean;
            }
        }
        return $result;
    }

    protected static function clean_data($input, $publishing) {
        if (!is_array($input)) return new WP_Error('snb_validation', 'Очікуються дані курсу.', ['status' => 400]);
        $common = parent::clean_data(array_merge($input, [
            'title' => $input['title'] ?? [], 'text' => ['uk' => 'Course', 'de' => 'Course'],
            'status' => ['uk' => 'Course', 'de' => 'Course'], 'icon' => 'users', 'isExample' => false,
        ]), $publishing);
        if (is_wp_error($common)) return $common;
        $data = array_intersect_key($common, array_flip(['order', 'imageId', 'imageAlt', 'imageFocus']));
        $slug = $input['slug'] ?? '';
        if (!is_string($slug) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 70) return new WP_Error('snb_validation', 'Адреса курсу: латинські малі літери, цифри й дефіси, до 70 символів.', ['status' => 400]);
        $data['slug'] = $slug; $data['contentId'] = static::content_id($slug);
        foreach (['title' => [160, true, false], 'summary' => [500, true, true], 'description' => [8000, true, true], 'ageGroup' => [160, true, false], 'language' => [160, true, false], 'format' => [160, true, false], 'location' => [300, true, false], 'price' => [300, true, false], 'duration' => [160, true, false]] as $name => $settings) {
            $value = static::translated($input, $name, $settings[0], $publishing, $settings[1], $settings[2]);
            if (is_wp_error($value)) return $value; $data[$name] = $value;
        }
        if (!$data['title']['uk'] && !$data['title']['de']) return new WP_Error('snb_validation', 'Додайте назву хоча б однією мовою.', ['status' => 400]);
        foreach ([['outcomes', true], ['materials', false]] as [$name, $required]) {
            $value = static::translated_list($input, $name, $publishing, $required);
            if (is_wp_error($value)) return $value; $data[$name] = $value;
        }
        if (!in_array($input['category'] ?? '', ['language', 'children', 'culture', 'integration', 'creative'], true)) return new WP_Error('snb_validation', 'Оберіть категорію курсу.', ['status' => 400]);
        if (!in_array($input['enrollmentStatus'] ?? '', ['open', 'waitlist', 'closed', 'planned'], true)) return new WP_Error('snb_validation', 'Оберіть статус набору.', ['status' => 400]);
        $data['category'] = $input['category']; $data['enrollmentStatus'] = $input['enrollmentStatus'];
        $date = $input['startsAt'] ?? '';
        if (!is_string($date) || ($date && (!preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date) || date('Y-m-d', strtotime($date)) !== $date))) return new WP_Error('snb_validation', 'Перевірте дату початку.', ['status' => 400]);
        $data['startsAt'] = $date;
        foreach (['seatsTotal', 'seatsAvailable'] as $name) if (!is_int($input[$name] ?? null) || $input[$name] < 0 || $input[$name] > 10000) return new WP_Error('snb_validation', 'Кількість місць має бути цілим числом від 0 до 10000.', ['status' => 400]);
        if (($input['seatsTotal'] === 0 && $input['seatsAvailable'] !== 0) || $input['seatsAvailable'] > $input['seatsTotal']) return new WP_Error('snb_validation', 'Вільних місць не може бути більше за загальну кількість.', ['status' => 400]);
        $data['seatsTotal'] = $input['seatsTotal']; $data['seatsAvailable'] = $input['seatsAvailable'];
        if (!is_bool($input['isFeatured'] ?? null)) return new WP_Error('snb_validation', 'Позначка рекомендованого курсу неправильна.', ['status' => 400]);
        $data['isFeatured'] = $input['isFeatured'];
        $schedule = $input['schedule'] ?? null;
        if (!is_array($schedule) || !array_is_list($schedule) || count($schedule) > 8) return new WP_Error('snb_validation', 'Перевірте розклад.', ['status' => 400]);
        $data['schedule'] = [];
        foreach ($schedule as $row) {
            if (!is_array($row)) return new WP_Error('snb_validation', 'Перевірте рядок розкладу.', ['status' => 400]);
            $weekday = static::translated($row, 'weekday', 160, $publishing, true); $cadence = static::translated($row, 'cadence', 160, $publishing, true);
            $time = static::field($row['time'] ?? '', 80);
            if (is_wp_error($weekday) || is_wp_error($cadence) || $time === null || !$time) return new WP_Error('snb_validation', 'Кожен рядок розкладу потребує дня, часу й періодичності обома мовами.', ['status' => 400]);
            $data['schedule'][] = ['weekday' => $weekday, 'time' => $time, 'cadence' => $cadence];
        }
        foreach (['teacherIds' => 10, 'relatedCourseIds' => 20] as $name => $limit) {
            $items = $input[$name] ?? null;
            if (!is_array($items) || !array_is_list($items) || count($items) > $limit || count(array_unique($items, SORT_REGULAR)) !== count($items)) return new WP_Error('snb_validation', "Перевірте $name.", ['status' => 400]);
            $pattern = $name === 'teacherIds' ? '/^person-[a-z0-9]+(?:-[a-z0-9]+)*$/D' : '/^course-[a-z0-9]+(?:-[a-z0-9]+)*$/D';
            foreach ($items as $item) if (!is_string($item) || !preg_match($pattern, $item)) return new WP_Error('snb_validation', "Неправильний ID у $name.", ['status' => 400]);
            $data[$name] = $items;
        }
        if ($publishing && !$data['imageId']) return new WP_Error('snb_validation', 'Для публікації курсу потрібне зображення.', ['status' => 400]);
        return $data;
    }

    protected static function records() {
        global $wpdb;
        return $wpdb->get_results($wpdb->prepare("SELECT p.ID, m.meta_value FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s WHERE p.post_type = %s AND p.post_status = 'draft' ORDER BY p.ID LIMIT 201", static::META, static::TYPE));
    }

    protected static function prepare_data($data, $state, $id, $action) {
        $previous = $state['working'];
        if ($previous && $data['slug'] !== $previous['slug']) return new WP_Error('snb_immutable_slug', 'Адресу збереженого курсу не можна змінювати.', ['status' => 409]);
        foreach (static::records() as $record) {
            if ((int) $record->ID === $id) continue;
            $other = json_decode($record->meta_value, true);
            if (($other['working']['slug'] ?? null) === $data['slug']) return new WP_Error('snb_duplicate_slug', 'Ця адреса вже закріплена за іншим курсом, навіть якщо він в архіві.', ['status' => 409]);
            if (($other['working']['contentId'] ?? null) === $data['contentId']) return new WP_Error('snb_duplicate_id', 'Внутрішній ID курсу вже використовується.', ['status' => 409]);
        }
        if ($action === 'publish') {
            $teachers = array_column(static::teacher_options(), null, 'id');
            foreach ($data['teacherIds'] as $teacher) if (!isset($teachers[$teacher])) return new WP_Error('snb_missing_teacher', 'Виберіть лише опублікованих викладачів із розділу «Люди».', ['status' => 409]);
            $courseIds = [];
            foreach (static::records() as $record) { $other = json_decode($record->meta_value, true); if (($other['working']['contentId'] ?? null)) $courseIds[] = $other['working']['contentId']; }
            foreach ($data['relatedCourseIds'] as $related) if ($related !== $data['contentId'] && !in_array($related, $courseIds, true)) return new WP_Error('snb_missing_course', 'Один зі схожих курсів не існує.', ['status' => 409]);
            if (in_array($data['contentId'], $data['relatedCourseIds'], true)) return new WP_Error('snb_validation', 'Курс не може посилатися сам на себе.', ['status' => 400]);
        }
        return $data;
    }

    public static function teacher_options() {
        global $wpdb;
        $rows = $wpdb->get_results($wpdb->prepare("SELECT m.meta_value FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s WHERE p.post_type = %s AND p.post_status = 'draft' LIMIT 200", static::META, Sonnenblume_People::TYPE));
        $items = [];
        foreach ($rows as $row) { $state = json_decode($row->meta_value, true); $person = $state['live'] ?? null; if (!$person || $state['archived'] || !in_array('teacher', $person['roles'], true)) continue; $items[] = ['id' => $person['contentId'], 'name' => $person['name']]; }
        usort($items, fn($a, $b) => strcmp($a['id'], $b['id']));
        return $items;
    }

    public static function published_ids_for_teacher($teacherId) {
        $ids = [];
        foreach (static::records() as $record) { $state = json_decode($record->meta_value, true); $course = $state['live'] ?? null; if ($course && !$state['archived'] && in_array($teacherId, $course['teacherIds'] ?? [], true)) $ids[] = $course['contentId']; }
        sort($ids); return $ids;
    }

    public static function write_update($request) {
        global $wpdb;
        $key = 'snb_structure_write_lock'; $token = wp_json_encode(['at' => time(), 'token' => wp_generate_uuid4()]);
        $old = $wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $key)); $lock = is_string($old) ? json_decode($old, true) : null;
        if ($lock && ($lock['at'] ?? 0) < time() - 300) { $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $key, $old)); wp_cache_delete($key, 'options'); }
        if ($wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')", $key, $token)) !== 1) return new WP_Error('snb_conflict', 'Інший профіль або курс зараз зберігається. Ваш текст залишився у формі; повторіть після оновлення списку.', ['status' => 409]);
        try { return parent::write_update($request); }
        finally { $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $key, $token)); wp_cache_delete($key, 'options'); }
    }

    public static function public_updates() {
        $items = [];
        foreach (static::records() as $record) {
            $state = json_decode($record->meta_value, true); $data = $state['live'] ?? null;
            if (!$data || $state['archived']) continue;
            $url = $data['imageId'] ? wp_get_attachment_image_url($data['imageId'], 'large') : false;
            $public = array_diff_key($data, array_flip(['contentId', 'imageId', 'imageAlt', 'imageFocus']));
            $public['id'] = $data['contentId']; $public['createdAt'] = $state['createdAt'] ?? $state['updatedAt']; $public['updatedAt'] = $state['publishedAt'];
            $public['image'] = $url ? ['url' => $url, 'alt' => $data['imageAlt'], 'focus' => $data['imageFocus']] : null;
            $items[] = $public;
        }
        $publishedIds = array_fill_keys(array_column($items, 'id'), true);
        foreach ($items as &$item) $item['relatedCourseIds'] = array_values(array_filter($item['relatedCourseIds'], fn($id) => isset($publishedIds[$id])));
        unset($item);
        usort($items, fn($a, $b) => ($a['order'] <=> $b['order']) ?: strcmp($a['id'], $b['id']));
        return new WP_REST_Response(['schemaVersion' => 1, 'items' => $items], 200, ['Cache-Control' => 'public, max-age=0, must-revalidate']);
    }
}
