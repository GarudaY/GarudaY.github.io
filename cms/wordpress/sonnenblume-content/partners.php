<?php
defined('ABSPATH') || exit;

final class Sonnenblume_Partners extends Sonnenblume_Content {
    const TYPE = 'snb_partner';
    const COLLECTION = 'partners';
    const LABEL = 'Партнери й подяки';
    const EDIT = 'snb_edit_partners';
    const EDIT_OTHERS = 'snb_edit_others_partners';
    const PUBLISH = 'snb_publish_partners';
    const MAX_BODY = 32000;

    public static function menu() {
        add_submenu_page('sonnenblume-content', 'Партнери — SONNENBLUME', 'Партнери', static::EDIT, 'sonnenblume-partners', [static::class, 'page']);
    }

    public static function routes() {
        parent::routes();
        register_rest_route(static::NS, '/partners/activate', [
            'methods' => 'POST', 'callback' => [static::class, 'activate'],
            'permission_callback' => fn() => current_user_can(static::PUBLISH)
                ? true : new WP_Error('snb_forbidden', 'Лише редактор може замінити поточний список.', ['status' => is_user_logged_in() ? 403 : 401]),
        ]);
    }

    public static function list_updates() {
        $response = parent::list_updates();
        $data = $response->get_data();
        $data['initialized'] = (bool) get_option('snb_partners_initialized', false);
        $response->set_data($data);
        return $response;
    }

    public static function activate() {
        $public = static::public_updates()->get_data();
        if (!$public['items']) return new WP_Error('snb_validation', 'Спочатку опублікуйте список партнерів.', ['status' => 400]);
        update_option('snb_partners_initialized', true, false);
        return new WP_REST_Response(['initialized' => true], 200, ['Cache-Control' => 'private, no-store']);
    }

    protected static function clean_data($input, $publishing) {
        if (!is_array($input)) return new WP_Error('snb_validation', 'Очікуються дані партнера.', ['status' => 400]);
        $common = parent::clean_data(array_merge($input, [
            'title' => ['uk' => 'Partner', 'de' => 'Partner'],
            'text' => ['uk' => 'Partner', 'de' => 'Partner'],
            'status' => ['uk' => 'Partner', 'de' => 'Partner'],
            'icon' => 'handshake', 'isExample' => false,
        ]), $publishing);
        if (is_wp_error($common)) return $common;
        $slug = $input['slug'] ?? null;
        if (!is_string($slug) || !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/D', $slug) || strlen($slug) > 70)
            return new WP_Error('snb_validation', 'Код: латинські малі літери, цифри й дефіси, до 70 символів.', ['status' => 400]);
        $kind = $input['kind'] ?? null;
        if (!in_array($kind, ['organization', 'person'], true)) return new WP_Error('snb_validation', 'Оберіть організацію або людину.', ['status' => 400]);
        $name = static::field($input['name'] ?? null, 160);
        if (!$name) return new WP_Error('snb_validation', 'Додайте ім’я або назву.', ['status' => 400]);
        if (isset($input['description']) && !is_array($input['description'])) return new WP_Error('snb_validation', 'Потрібні переклади опису.', ['status' => 400]);
        $description = [];
        foreach (['uk', 'de'] as $locale) {
            $description[$locale] = static::field($input['description'][$locale] ?? '', 800, true);
            if ($description[$locale] === null || ($publishing && !$description[$locale]))
                return new WP_Error('snb_validation', "Для публікації опишіть підтримку ($locale).", ['status' => 400]);
        }
        $website = $input['website'] ?? '';
        if (!is_string($website) || strlen($website) > 500 || ($website && (!filter_var($website, FILTER_VALIDATE_URL) || wp_parse_url($website, PHP_URL_SCHEME) !== 'https' || wp_parse_url($website, PHP_URL_USER) || wp_parse_url($website, PHP_URL_PASS))))
            return new WP_Error('snb_validation', 'Вебсайт має бути звичайним HTTPS-посиланням без логіна.', ['status' => 400]);
        if (!is_bool($input['publicationPermission'] ?? null)) return new WP_Error('snb_validation', 'Підтвердження згоди має бути позначкою.', ['status' => 400]);
        if ($publishing && $kind === 'person' && !$input['publicationPermission'])
            return new WP_Error('snb_validation', 'Підтвердіть згоду людини на публікацію імені та фотографії.', ['status' => 400]);
        if ($publishing && $kind === 'organization' && !$common['imageId'])
            return new WP_Error('snb_validation', 'Для організації додайте логотип із медіатеки.', ['status' => 400]);
        return [
            'slug' => $slug, 'kind' => $kind, 'name' => $name,
            'description' => $description, 'website' => trim($website),
            'publicationPermission' => $input['publicationPermission'],
            'order' => $common['order'], 'imageId' => $common['imageId'],
            'imageAlt' => $common['imageAlt'], 'imageFocus' => $common['imageFocus'],
        ];
    }

    protected static function prepare_data($data, $state, $id, $action) {
        if ($state['working'] && $data['slug'] !== $state['working']['slug'])
            return new WP_Error('snb_immutable_slug', 'Код збереженого партнера не можна змінювати.', ['status' => 409]);
        global $wpdb;
        $records = $wpdb->get_results($wpdb->prepare("SELECT p.ID, m.meta_value FROM {$wpdb->posts} p INNER JOIN {$wpdb->postmeta} m ON m.post_id = p.ID AND m.meta_key = %s WHERE p.post_type = %s AND p.post_status = 'draft' ORDER BY p.ID LIMIT 201", static::META, static::TYPE));
        foreach ($records as $post) {
            if ((int) $post->ID === $id) continue;
            $other = json_decode($post->meta_value, true);
            if (($other['working']['slug'] ?? null) === $data['slug'])
                return new WP_Error('snb_duplicate_slug', 'Цей код уже зайнято, навіть якщо запис в архіві.', ['status' => 409]);
        }
        return $data;
    }

    public static function write_update($request) {
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
        if ($acquired !== 1) return new WP_Error('snb_conflict', 'Інший запис зараз зберігається. Оновіть список і повторіть.', ['status' => 409]);
        try { return parent::write_update($request); }
        finally {
            $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s", $key, $token));
            wp_cache_delete($key, 'options');
        }
    }

    public static function public_updates() {
        $items = [];
        $posts = get_posts(['post_type' => static::TYPE, 'post_status' => 'draft', 'numberposts' => 200]);
        foreach ($posts as $post) {
            $state = static::state($post->ID);
            if (!$state || !$state['live'] || $state['archived']) continue;
            $data = $state['live'];
            $image_url = $data['imageId'] ? wp_get_attachment_image_url($data['imageId'], 'large') : false;
            $items[] = [
                'id' => $data['slug'], 'kind' => $data['kind'], 'name' => $data['name'],
                'description' => $data['description'], 'website' => $data['website'],
                'order' => $data['order'],
                'image' => $image_url ? ['url' => $image_url, 'alt' => $data['imageAlt'], 'focus' => $data['imageFocus']] : null,
            ];
        }
        usort($items, fn($a, $b) => ($a['order'] <=> $b['order']) ?: strcmp($a['id'], $b['id']));
        return new WP_REST_Response(['schemaVersion' => 1, 'initialized' => (bool) get_option('snb_partners_initialized', false), 'items' => $items], 200, ['Cache-Control' => 'public, max-age=0, must-revalidate']);
    }
}
