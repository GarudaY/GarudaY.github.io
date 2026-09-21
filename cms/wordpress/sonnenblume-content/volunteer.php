<?php
defined('ABSPATH') || exit;

final class Sonnenblume_Volunteer extends Sonnenblume_Content {
    const TYPE = 'snb_volunteer';
    const COLLECTION = 'volunteer';
    const LABEL = 'Волонтерські завдання';
    const EDIT = 'snb_edit_volunteer';
    const EDIT_OTHERS = 'snb_edit_others_volunteer';
    const PUBLISH = 'snb_publish_volunteer';
    const MAX_BODY = 32000;

    public static function menu() {
        add_submenu_page('sonnenblume-content', 'Волонтерство — SONNENBLUME', 'Волонтерство', static::EDIT, 'sonnenblume-volunteer', [static::class, 'page']);
    }

    protected static function translation($input, $name, $max, $publishing) {
        if (isset($input[$name]) && !is_array($input[$name])) return new WP_Error('snb_validation', "Перевірте переклади $name.", ['status' => 400]);
        $value = [];
        foreach (['uk', 'de'] as $locale) {
            $value[$locale] = static::field($input[$name][$locale] ?? '', $max, $name === 'description');
            if ($value[$locale] === null || ($publishing && !$value[$locale])) return new WP_Error('snb_validation', "Заповніть $name ($locale) для публікації.", ['status' => 400]);
        }
        return $value;
    }

    protected static function clean_data($input, $publishing) {
        if (!is_array($input)) return new WP_Error('snb_validation', 'Очікуються дані завдання.', ['status' => 400]);
        $common = parent::clean_data(array_merge($input, [
            'title' => $input['title'] ?? [],
            'text' => ['uk' => 'Volunteer', 'de' => 'Volunteer'],
            'status' => ['uk' => 'Volunteer', 'de' => 'Volunteer'],
            'icon' => 'users',
            'isExample' => false,
            'imageId' => 0,
        ]), $publishing);
        if (is_wp_error($common)) return $common;
        $slug = $input['slug'] ?? '';
        if (!is_string($slug) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 70)
            return new WP_Error('snb_validation', 'Адреса завдання: малі латинські літери, цифри й дефіси, до 70 символів.', ['status' => 400]);
        $data = ['slug' => $slug, 'order' => $common['order']];
        foreach (['title' => 160, 'description' => 1200, 'time' => 180, 'location' => 180] as $name => $max) {
            $value = static::translation($input, $name, $max, $publishing);
            if (is_wp_error($value)) return $value;
            $data[$name] = $value;
        }
        if (!$data['title']['uk'] && !$data['title']['de'])
            return new WP_Error('snb_validation', 'Додайте назву хоча б однією мовою.', ['status' => 400]);
        $icon = $input['icon'] ?? '';
        if (!in_array($icon, ['calendar', 'camera', 'languages', 'list', 'heart'], true))
            return new WP_Error('snb_validation', 'Оберіть піктограму завдання.', ['status' => 400]);
        $data['icon'] = $icon;
        return $data;
    }

    protected static function prepare_data($data, $state, $id, $action) {
        if ($state['working'] && $data['slug'] !== $state['working']['slug'])
            return new WP_Error('snb_immutable_slug', 'Адресу збереженого завдання не можна змінювати.', ['status' => 409]);
        global $wpdb;
        $records = $wpdb->get_results($wpdb->prepare("SELECT p.ID, m.meta_value FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s WHERE p.post_type = %s AND p.post_status = 'draft' ORDER BY p.ID LIMIT 201", static::META, static::TYPE));
        foreach ($records as $post) {
            if ((int) $post->ID === $id) continue;
            $other = json_decode($post->meta_value, true);
            if (($other['working']['slug'] ?? null) === $data['slug'])
                return new WP_Error('snb_duplicate_slug', 'Ця адреса вже зайнята, навіть якщо завдання в архіві.', ['status' => 409]);
        }
        return $data;
    }

    public static function write_update($request) {
        // The shared structural lock also protects profile/course relationships and new slugs.
        global $wpdb;
        $key = 'snb_structure_write_lock';
        $token = wp_json_encode(['at' => time(), 'token' => wp_generate_uuid4()]);
        $old = $wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $key));
        $lock = is_string($old) ? json_decode($old, true) : null;
        if ($lock && ($lock['at'] ?? 0) < time() - 300) {
            $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $key, $old));
            wp_cache_delete($key, 'options');
        }
        $acquired = $wpdb->query($wpdb->prepare("INSERT IGNORE INTO {$wpdb->options} (option_name, option_value, autoload) VALUES (%s, %s, 'off')", $key, $token));
        if ($acquired !== 1) return new WP_Error('snb_conflict', 'Інше завдання зараз зберігається. Ваш текст залишився у формі; оновіть список і повторіть.', ['status' => 409]);
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
            $items[] = [
                'id' => $data['slug'], 'title' => $data['title'],
                'description' => $data['description'], 'time' => $data['time'],
                'location' => $data['location'], 'icon' => $data['icon'],
                'order' => $data['order'],
            ];
        }
        usort($items, fn($a, $b) => ($a['order'] <=> $b['order']) ?: strcmp($a['id'], $b['id']));
        return new WP_REST_Response(['schemaVersion' => 1, 'items' => $items], 200, ['Cache-Control' => 'public, max-age=0, must-revalidate']);
    }
}
