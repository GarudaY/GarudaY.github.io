<?php
defined('ABSPATH') || exit;

final class Sonnenblume_People extends Sonnenblume_Content {
    const TYPE = 'snb_person';
    const COLLECTION = 'people';
    const LABEL = 'Люди SONNENBLUME';
    const EDIT = 'snb_edit_people';
    const EDIT_OTHERS = 'snb_edit_others_people';
    const PUBLISH = 'snb_publish_people';
    const MAX_BODY = 100000;

    public static function menu() {
        add_submenu_page('sonnenblume-content', 'Люди — SONNENBLUME', 'Люди', static::EDIT, 'sonnenblume-people', [static::class, 'page']);
    }

    protected static function clean_data($input, $publishing) {
        if (!is_array($input)) return new WP_Error('snb_validation', 'Очікуються дані профілю.', ['status' => 400]);
        // Reuse the same attachment ownership, safe formats, alt text and numeric checks as news.
        $common = parent::clean_data(array_merge($input, [
            'title' => ['uk' => 'Profile', 'de' => 'Profile'],
            'text' => ['uk' => 'Profile', 'de' => 'Profile'],
            'status' => ['uk' => 'Profile', 'de' => 'Profile'], 'icon' => 'users', 'isExample' => false,
        ]), $publishing);
        if (is_wp_error($common)) return $common;
        $data = array_intersect_key($common, array_flip(['order', 'imageId', 'imageAlt', 'imageFocus']));
        foreach (['name' => 120, 'roleLabel' => 160, 'bio' => 8000, 'teacherRoleLabel' => 160, 'teacherBio' => 3000] as $name => $max) {
            if (isset($input[$name]) && !is_array($input[$name])) return new WP_Error('snb_validation', "Поле $name має містити переклади.", ['status' => 400]);
            foreach (['uk', 'de'] as $locale) {
                $value = static::field($input[$name][$locale] ?? '', $max, in_array($name, ['bio', 'teacherBio'], true));
                if ($value === null) return new WP_Error('snb_validation', "Перевірте $name ($locale): формат або довжину.", ['status' => 400]);
                $data[$name][$locale] = $value;
                if ($publishing && in_array($name, ['name', 'roleLabel', 'bio'], true) && !$value) return new WP_Error('snb_validation', 'Для публікації заповніть ім’я, роль та біографію обома мовами.', ['status' => 400]);
            }
        }
        if (!$data['name']['uk'] && !$data['name']['de']) return new WP_Error('snb_validation', 'Додайте ім’я хоча б однією мовою.', ['status' => 400]);
        $slug = $input['slug'] ?? '';
        if (!is_string($slug) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 70) return new WP_Error('snb_validation', 'Адреса профілю: латинські малі літери, цифри й дефіси, до 70 символів.', ['status' => 400]);
        $data['slug'] = $slug;
        $data['contentId'] = 'person-' . $slug;
        $roles = $input['roles'] ?? null;
        if (!is_array($roles) || !array_is_list($roles) || !$roles || count($roles) > 4 || count(array_unique($roles, SORT_REGULAR)) !== count($roles)) return new WP_Error('snb_validation', 'Оберіть принаймні одну роль без повторень.', ['status' => 400]);
        foreach ($roles as $role) if (!is_string($role) || !in_array($role, ['board', 'team', 'teacher', 'volunteer'], true)) return new WP_Error('snb_validation', 'Невідома роль.', ['status' => 400]);
        $data['roles'] = $roles;
        $position = $input['boardPosition'] ?? null;
        if (in_array('board', $roles, true) ? !in_array($position, ['chair', 'member'], true) : $position !== null) return new WP_Error('snb_validation', 'Укажіть місце у правлінні тільки для члена правління.', ['status' => 400]);
        $data['boardPosition'] = $position;
        if ($publishing && in_array('teacher', $roles, true)) {
            foreach (['uk', 'de'] as $locale) if (!$data['teacherRoleLabel'][$locale] || !$data['teacherBio'][$locale]) return new WP_Error('snb_validation', 'Для викладача заповніть окрему викладацьку роль та опис обома мовами.', ['status' => 400]);
        }
        $languages = $input['languages'] ?? [];
        if (!is_array($languages) || !array_is_list($languages) || count($languages) > 10) return new WP_Error('snb_validation', 'Перевірте список мов.', ['status' => 400]);
        foreach ($languages as $language) if (!is_string($language) || !preg_match('/^[a-z]{2,8}$/D', $language)) return new WP_Error('snb_validation', 'Мови задаються короткими кодами: uk, de, en.', ['status' => 400]);
        $data['languages'] = array_values(array_unique($languages));
        if (!is_bool($input['publicationPermission'] ?? null)) return new WP_Error('snb_validation', 'Підтвердження дозволу має бути позначкою.', ['status' => 400]);
        $data['publicationPermission'] = $input['publicationPermission'];
        if ($publishing && !$data['publicationPermission']) return new WP_Error('snb_validation', 'Підтвердіть дозвіл на публікацію профілю та фотографії.', ['status' => 400]);
        return $data;
    }

    protected static function prepare_data($data, $state, $id, $action) {
        $previous = $state['working'];
        if ($previous && $data['slug'] !== $previous['slug']) return new WP_Error('snb_immutable_slug', 'Адресу збереженого профілю не можна змінювати: з нею пов’язані курси та посилання.', ['status' => 409]);
        // Course links are imported/managed by the course module, never supplied by a profile writer.
        $data['relatedCourseIds'] = class_exists('Sonnenblume_Courses') ? Sonnenblume_Courses::published_ids_for_teacher($data['contentId']) : ($previous['relatedCourseIds'] ?? []);
        if ($data['relatedCourseIds'] && ($action === 'archive' || !in_array('teacher', $data['roles'], true))) return new WP_Error('snb_linked_teacher', 'Профіль пов’язаний з опублікованими курсами. Спочатку змініть викладача в розділі «Курси».', ['status' => 409]);
        // Structural checks must see current DB state, not a request/object-cache snapshot.
        global $wpdb;
        $records = $wpdb->get_results($wpdb->prepare("SELECT p.ID, m.meta_value FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s WHERE p.post_type = %s AND p.post_status = 'draft' ORDER BY p.ID LIMIT 201", static::META, static::TYPE));
        foreach ($records as $post) {
            if ((int) $post->ID === $id) continue;
            $other = json_decode($post->meta_value, true);
            if (($other['working']['slug'] ?? null) === $data['slug']) return new WP_Error('snb_duplicate_slug', 'Ця адреса вже закріплена за іншим профілем, навіть якщо він в архіві.', ['status' => 409]);
            if ($action === 'publish' && $data['boardPosition'] === 'chair' && !$other['archived'] && ($other['live']['boardPosition'] ?? null) === 'chair') return new WP_Error('snb_duplicate_chair', 'Голова правління вже опублікована. Спочатку змініть її місце на «Член правління» та опублікуйте.', ['status' => 409]);
        }
        return $data;
    }

    public static function write_update($request) {
        // Serialize structural changes as well as per-record CAS: duplicate slugs/chairs must not race.
        global $wpdb;
        $key = 'snb_structure_write_lock';
        $token = wp_json_encode(['at' => time(), 'token' => wp_generate_uuid4()]);
        $old = $wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $key));
        $lock = is_string($old) ? json_decode($old, true) : null;
        if ($lock && ($lock['at'] ?? 0) < time() - 300) {
            $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $key, $old));
            wp_cache_delete($key, 'options');
        }
        // add_option() uses ON DUPLICATE KEY UPDATE and is not a mutex: a racing
        // request can replace the token. INSERT IGNORE uses the DB unique key instead.
        $acquired = $wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')", $key, $token));
        if ($acquired !== 1) return new WP_Error('snb_conflict', 'Інший профіль зараз зберігається. Ваш текст залишився у формі; оновіть список і повторіть.', ['status' => 409]);
        try { return parent::write_update($request); }
        finally {
            $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $key, $token));
            wp_cache_delete($key, 'options');
        }
    }

    public static function public_updates() {
        $items = [];
        foreach (get_posts(['post_type' => static::TYPE, 'post_status' => 'draft', 'numberposts' => 200]) as $post) {
            $state = static::state($post->ID);
            if (!$state || !$state['live'] || $state['archived']) continue;
            $data = $state['live'];
            if (class_exists('Sonnenblume_Courses')) $data['relatedCourseIds'] = Sonnenblume_Courses::published_ids_for_teacher($data['contentId']);
            $url = $data['imageId'] ? wp_get_attachment_image_url($data['imageId'], 'large') : false;
            $items[] = array_intersect_key($data, array_flip(['slug', 'name', 'roleLabel', 'teacherRoleLabel', 'bio', 'teacherBio', 'roles', 'boardPosition', 'languages', 'relatedCourseIds', 'order'])) + [
                'id' => $data['contentId'], 'createdAt' => $state['createdAt'] ?? ($state['history'][count($state['history']) - 1]['at'] ?? $state['updatedAt']), 'updatedAt' => $state['publishedAt'],
                'image' => $url ? ['url' => $url, 'alt' => $data['imageAlt'], 'focus' => $data['imageFocus']] : null,
            ];
        }
        usort($items, fn($a, $b) => ($a['order'] <=> $b['order']) ?: strcmp($a['id'], $b['id']));
        return new WP_REST_Response(['schemaVersion' => 1, 'items' => $items], 200, ['Cache-Control' => 'public, max-age=0, must-revalidate']);
    }
}
