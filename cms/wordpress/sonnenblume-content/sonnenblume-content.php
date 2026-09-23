<?php
/**
 * Plugin Name: SONNENBLUME Content
 * Description: Structured bilingual news, people, courses, events, volunteer tasks and partners with review workflow and public APIs for the SONNENBLUME frontend.
 * Version: 0.7.0
 * Requires at least: 6.5
 * Requires PHP: 8.2
 * License: GPL-2.0-or-later
 */

defined('ABSPATH') || exit;

class Sonnenblume_Content {
    const VERSION = '0.7.0';
    const TYPE = 'snb_update';
    const COLLECTION = 'updates';
    const LABEL = 'Новини спільноти';
    const EDIT = 'snb_edit_updates';
    const EDIT_OTHERS = 'snb_edit_others_updates';
    const PUBLISH = 'snb_publish_updates';
    const MAX_BODY = 20000;
    const META = '_snb_state';
    const NS = 'sonnenblume/v1';

    public static function install() {
        $author = ['read' => true, 'upload_files' => true, 'snb_edit_updates' => true];
        $author['snb_edit_people'] = true;
        $author['snb_edit_courses'] = true;
        $author['snb_edit_events'] = true;
        $author['snb_edit_volunteer'] = true;
        $author['snb_edit_partners'] = true;
        $editor = $author + ['snb_edit_others_people' => true, 'snb_publish_people' => true] + ['snb_edit_others_updates' => true, 'snb_publish_updates' => true] + ['snb_edit_others_courses' => true, 'snb_publish_courses' => true] + ['snb_edit_others_events' => true, 'snb_publish_events' => true] + ['snb_edit_others_volunteer' => true, 'snb_publish_volunteer' => true] + ['snb_edit_others_partners' => true, 'snb_publish_partners' => true];
        foreach (['snb_author' => ['Автор SONNENBLUME', $author], 'snb_editor' => ['Редактор SONNENBLUME', $editor]] as $name => $definition) {
            if (!get_role($name)) add_role($name, $definition[0], $definition[1]);
            $role = get_role($name);
            foreach ($definition[1] as $cap => $enabled) $role->add_cap($cap, $enabled);
        }
        $admin = get_role('administrator');
        if ($admin) foreach ($editor as $cap => $enabled) $admin->add_cap($cap, $enabled);
        foreach (['snb_editor', 'administrator'] as $role_name) {
            $operations_role = get_role($role_name);
            if ($operations_role) $operations_role->add_cap('snb_manage_operations', true);
        }
        if (class_exists('Sonnenblume_Operations')) Sonnenblume_Operations::install();
        update_option('snb_content_version', static::VERSION, false);
    }

    public static function boot() {
        if (get_option('snb_content_version') !== static::VERSION) static::install();
        // The core post editor/API is intentionally disabled: all writes use the workflow below.
        register_post_type(static::TYPE, [
            'label' => static::LABEL, 'public' => false, 'show_ui' => false,
            'show_in_rest' => false, 'supports' => [], 'can_export' => true,
            'capability_type' => [static::TYPE, static::TYPE . 's'], 'map_meta_cap' => true,
        ]);
    }

    public static function can_edit() {
        return current_user_can(static::EDIT) ? true : new WP_Error('snb_forbidden', 'Увійдіть обліковим записом автора або редактора.', ['status' => is_user_logged_in() ? 403 : 401]);
    }

    public static function routes() {
        register_rest_route(static::NS, '/' . static::COLLECTION . '/public', [
            'methods' => 'GET', 'callback' => [static::class, 'public_updates'], 'permission_callback' => '__return_true',
        ]);
        register_rest_route(static::NS, '/' . static::COLLECTION, [
            ['methods' => 'GET', 'callback' => [static::class, 'list_updates'], 'permission_callback' => [static::class, 'can_edit']],
            ['methods' => 'POST', 'callback' => [static::class, 'write_update'], 'permission_callback' => [static::class, 'can_edit']],
        ]);
        register_rest_route(static::NS, '/' . static::COLLECTION . '/(?P<id>\d+)', [
            ['methods' => 'GET', 'callback' => [static::class, 'get_update'], 'permission_callback' => [static::class, 'can_edit']],
            ['methods' => 'POST', 'callback' => [static::class, 'write_update'], 'permission_callback' => [static::class, 'can_edit']],
        ]);
    }

    protected static function post_for_user($id) {
        $post = get_post($id);
        if (!$post || $post->post_type !== static::TYPE) return new WP_Error('snb_missing', 'Новину не знайдено.', ['status' => 404]);
        if ((int) $post->post_author !== get_current_user_id() && !current_user_can(static::EDIT_OTHERS)) {
            return new WP_Error('snb_forbidden', 'Ви можете редагувати лише власні новини.', ['status' => 403]);
        }
        return $post;
    }

    protected static function state($id) {
        $raw = get_post_meta($id, static::META, true);
        return is_string($raw) ? json_decode($raw, true) : null;
    }

    protected static function representation($post, $state) {
        return [
            'id' => (int) $post->ID, 'authorId' => (int) $post->post_author,
            'authorName' => get_the_author_meta('display_name', $post->post_author),
            'revision' => $state['revision'], 'workflow' => $state['workflow'],
            'archived' => $state['archived'], 'hasLive' => $state['live'] !== null,
            'hasChanges' => $state['working'] !== $state['live'],
            'data' => $state['working'], 'live' => $state['live'],
            'updatedAt' => $state['updatedAt'], 'history' => $state['history'],
            'canPublish' => current_user_can(static::PUBLISH),
        ];
    }

    public static function list_updates() {
        $args = ['post_type' => static::TYPE, 'post_status' => 'draft', 'numberposts' => 200, 'orderby' => 'ID', 'order' => 'DESC'];
        if (!current_user_can(static::EDIT_OTHERS)) $args['author'] = get_current_user_id();
        $items = [];
        foreach (get_posts($args) as $post) {
            $state = static::state($post->ID);
            if ($state) $items[] = static::representation($post, $state);
        }
        return new WP_REST_Response(['items' => $items], 200, ['Cache-Control' => 'private, no-store']);
    }

    public static function get_update($request) {
        $post = static::post_for_user((int) $request['id']);
        if (is_wp_error($post)) return $post;
        $state = static::state($post->ID);
        if (!$state) return new WP_Error('snb_missing_state', 'Дані новини пошкоджено. Зверніться до адміністратора.', ['status' => 500]);
        return new WP_REST_Response(static::representation($post, $state), 200, ['Cache-Control' => 'private, no-store']);
    }

    protected static function field($value, $max, $multiline = false) {
        if (!is_string($value) || mb_strlen($value) > $max) return null;
        return trim($multiline ? sanitize_textarea_field($value) : sanitize_text_field($value));
    }

    protected static function clean_data($input, $publishing) {
        if (!is_array($input)) return new WP_Error('snb_validation', 'Перевірте поля новини.', ['status' => 400]);
        $data = [];
        foreach (['title' => 160, 'text' => 1800, 'status' => 70, 'imageAlt' => 180] as $name => $max) {
            if (isset($input[$name]) && !is_array($input[$name])) return new WP_Error('snb_validation', "Поле $name має містити переклади uk та de.", ['status' => 400]);
            foreach (['uk', 'de'] as $locale) {
                $value = static::field($input[$name][$locale] ?? '', $max, $name === 'text');
                if ($value === null) return new WP_Error('snb_validation', "Поле $name ($locale) має неправильний формат або задовге.", ['status' => 400]);
                $data[$name][$locale] = $value;
                if ($publishing && $name !== 'imageAlt' && $value === '') return new WP_Error('snb_validation', 'Для публікації заповніть заголовок, категорію та текст обома мовами.', ['status' => 400]);
            }
        }
        if ($data['title']['uk'] === '' && $data['title']['de'] === '') return new WP_Error('snb_validation', 'Додайте заголовок хоча б однією мовою.', ['status' => 400]);
        if (!in_array($input['icon'] ?? '', ['handshake', 'lightbulb', 'users'], true)) return new WP_Error('snb_validation', 'Оберіть піктограму зі списку.', ['status' => 400]);
        $data['icon'] = $input['icon'];
        if (!is_int($input['order'] ?? null) || $input['order'] < 0 || $input['order'] > 999) return new WP_Error('snb_validation', 'Порядок має бути цілим числом від 0 до 999.', ['status' => 400]);
        $data['order'] = $input['order'];
        $image = $input['imageId'] ?? 0;
        if (!is_int($image) || $image < 0) return new WP_Error('snb_validation', 'Неправильне зображення.', ['status' => 400]);
        if ($image) {
            $attachment = get_post($image);
            if (!$attachment || $attachment->post_type !== 'attachment' || !in_array(get_post_mime_type($image), ['image/jpeg', 'image/png', 'image/webp', 'image/avif'], true)) return new WP_Error('snb_validation', 'Оберіть JPEG, PNG, WebP або AVIF з медіатеки.', ['status' => 400]);
            if (!current_user_can(static::EDIT_OTHERS) && (int) $attachment->post_author !== get_current_user_id()) return new WP_Error('snb_forbidden_media', 'Автор може використовувати лише власні завантаження.', ['status' => 403]);
            if ($publishing && (!$data['imageAlt']['uk'] || !$data['imageAlt']['de'])) return new WP_Error('snb_validation', 'Додайте опис зображення обома мовами.', ['status' => 400]);
        }
        $data['imageId'] = $image;
        $focus = $input['imageFocus'] ?? 50;
        if (!is_int($focus) || $focus < 0 || $focus > 100) return new WP_Error('snb_validation', 'Фокус зображення має бути від 0 до 100.', ['status' => 400]);
        $data['imageFocus'] = $focus;
        if (isset($input['isExample']) && !is_bool($input['isExample'])) return new WP_Error('snb_validation', 'Позначка прикладу має неправильний формат.', ['status' => 400]);
        $data['isExample'] = ($input['isExample'] ?? false) === true;
        return $data;
    }

    protected static function prepare_data($data, $state, $id, $action) { return $data; }

    public static function write_update($request) {
        if (strlen($request->get_body()) > static::MAX_BODY) return new WP_Error('snb_too_large', 'Запит завеликий.', ['status' => 413]);
        $body = $request->get_json_params();
        if (!is_array($body)) return new WP_Error('snb_validation', 'Очікується JSON.', ['status' => 400]);
        $action = $body['action'] ?? 'save';
        if (!in_array($action, ['save', 'submit', 'publish', 'archive', 'restore'], true)) return new WP_Error('snb_validation', 'Невідома дія.', ['status' => 400]);
        if (in_array($action, ['publish', 'archive', 'restore'], true) && !current_user_can(static::PUBLISH)) return new WP_Error('snb_forbidden', 'Ця дія доступна лише редактору.', ['status' => 403]);
        $id = (int) ($request['id'] ?? 0);
        $old_raw = null;
        if ($id) {
            $post = static::post_for_user($id);
            if (is_wp_error($post)) return $post;
            $old_raw = get_post_meta($id, static::META, true);
            $state = is_string($old_raw) ? json_decode($old_raw, true) : null;
            if (!$state) return new WP_Error('snb_missing_state', 'Дані новини пошкоджено.', ['status' => 500]);
            if (!is_int($body['revision'] ?? null) || $body['revision'] !== $state['revision']) return new WP_Error('snb_conflict', 'Новину вже змінила інша людина. Оновіть список і відкрийте її знову; ваш текст залишився у формі.', ['status' => 409]);
            if ($state['archived'] && !current_user_can(static::PUBLISH)) return new WP_Error('snb_forbidden', 'Новину архівовано редактором.', ['status' => 403]);
        } else {
            if (!in_array($action, ['save', 'submit', 'publish'], true)) return new WP_Error('snb_validation', 'Спочатку збережіть новину.', ['status' => 400]);
            if (count(get_posts(['post_type' => static::TYPE, 'post_status' => 'draft', 'numberposts' => 201, 'fields' => 'ids'])) >= 200) return new WP_Error('snb_limit', 'Досягнуто ліміт 200 новин. Зверніться до адміністратора.', ['status' => 409]);
            $state = ['revision' => 0, 'working' => null, 'live' => null, 'workflow' => 'draft', 'archived' => false, 'history' => [], 'createdAt' => gmdate('c'), 'updatedAt' => gmdate('c'), 'publishedAt' => null];
        }
        if ($action === 'restore') {
            $data = null;
            foreach ($state['history'] as $entry) if ($entry['revision'] === ($body['targetRevision'] ?? null)) $data = $entry['data'];
            if (!$data) return new WP_Error('snb_missing_revision', 'Версію не знайдено.', ['status' => 404]);
        } elseif ($action === 'archive') {
            $data = $state['working'];
        } else {
            $data = static::clean_data($body['data'] ?? null, $action === 'publish');
            if (is_wp_error($data)) return $data;
        }
        $data = static::prepare_data($data, $state, $id, $action);
        if (is_wp_error($data)) return $data;
        if (!$id) {
            $id = wp_insert_post(['post_type' => static::TYPE, 'post_status' => 'draft', 'post_author' => get_current_user_id(), 'post_title' => static::LABEL], true);
            if (is_wp_error($id)) return $id;
            $post = get_post($id);
        }
        if (!isset($state['createdAt'])) {
            $state['createdAt'] = $state['history'][count($state['history']) - 1]['at'] ?? $state['updatedAt'];
        }
        if ($state['working'] !== null) {
            array_unshift($state['history'], ['revision' => $state['revision'], 'data' => $state['working'], 'at' => $state['updatedAt'], 'replacedBy' => get_current_user_id(), 'action' => $action]);
            $state['history'] = array_slice($state['history'], 0, 20);
        }
        $state['working'] = $data;
        $state['workflow'] = $action === 'submit' ? 'review' : 'draft';
        if ($action === 'publish') {
            $state['live'] = $data;
            $state['publishedAt'] = gmdate('c');
            $state['workflow'] = 'published';
            $state['archived'] = false;
        } elseif ($action === 'archive') {
            $state['live'] = null;
            $state['archived'] = true;
            $state['workflow'] = 'archived';
        }
        $state['revision']++;
        $state['updatedAt'] = gmdate('c');
        $next_raw = wp_json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        // One compare-and-swap state update prevents a draft/live race and lost edits.
        $saved = $old_raw === null
            ? add_post_meta($id, static::META, wp_slash($next_raw), true)
            : update_post_meta($id, static::META, wp_slash($next_raw), $old_raw);
        if (!$saved) return new WP_Error('snb_conflict', 'Конфлікт збереження. Оновіть новину перед повторною спробою.', ['status' => 409]);
        return new WP_REST_Response(static::representation($post, $state), $old_raw === null ? 201 : 200, ['Cache-Control' => 'private, no-store']);
    }

    public static function public_updates() {
        $items = [];
        foreach (get_posts(['post_type' => static::TYPE, 'post_status' => 'draft', 'numberposts' => 200]) as $post) {
            $state = static::state($post->ID);
            if (!$state || !$state['live'] || $state['archived']) continue;
            $data = $state['live'];
            $image_url = $data['imageId'] ? wp_get_attachment_image_url($data['imageId'], 'large') : false;
            $items[] = [
                'id' => (int) $post->ID, 'title' => $data['title'], 'text' => $data['text'], 'status' => $data['status'],
                'icon' => $data['icon'], 'order' => $data['order'], 'isExample' => $data['isExample'],
                'publishedAt' => $state['publishedAt'],
                'image' => $image_url ? ['url' => $image_url, 'alt' => $data['imageAlt'], 'focus' => $data['imageFocus']] : null,
            ];
        }
        usort($items, fn($a, $b) => ($a['order'] <=> $b['order']) ?: ($b['id'] <=> $a['id']));
        return new WP_REST_Response(['schemaVersion' => 1, 'items' => $items], 200, ['Cache-Control' => 'public, max-age=0, must-revalidate']);
    }

    public static function menu() {
        add_menu_page('SONNENBLUME — редактор', 'SONNENBLUME', 'snb_edit_updates', 'sonnenblume-content', [static::class, 'page'], 'dashicons-edit-page', 3);
    }

    public static function page() {
        if (!current_user_can(static::EDIT)) return;
        echo '<div id="snb-app" class="wrap snb-app"><noscript>Увімкніть JavaScript для редактора.</noscript></div>';
    }

    public static function assets($hook) {
        if (!in_array($hook, ['toplevel_page_sonnenblume-content', 'sonnenblume_page_sonnenblume-people', 'sonnenblume_page_sonnenblume-courses', 'sonnenblume_page_sonnenblume-events', 'sonnenblume_page_sonnenblume-volunteer', 'sonnenblume_page_sonnenblume-partners'], true)) return;
        $people = $hook === 'sonnenblume_page_sonnenblume-people';
        $courses = $hook === 'sonnenblume_page_sonnenblume-courses';
        $events = $hook === 'sonnenblume_page_sonnenblume-events';
        $volunteer = $hook === 'sonnenblume_page_sonnenblume-volunteer';
        $partners = $hook === 'sonnenblume_page_sonnenblume-partners';
        wp_enqueue_media();
        wp_enqueue_style('snb-content', plugins_url('admin.css', __FILE__), [], static::VERSION);
        wp_enqueue_script('snb-content', plugins_url($partners ? 'partners-admin.js' : ($volunteer ? 'volunteer-admin.js' : ($events ? 'events-admin.js' : ($courses ? 'courses-admin.js' : 'admin.js'))), __FILE__), [], static::VERSION, true);
        wp_add_inline_script('snb-content', 'window.SNB_CONTENT = ' . wp_json_encode([
            'api' => rest_url(static::NS . ($partners ? '/partners' : ($volunteer ? '/volunteer' : ($events ? '/events' : ($courses ? '/courses' : ($people ? '/people' : '/updates')))))), 'nonce' => wp_create_nonce('wp_rest'),
            'collection' => $partners ? 'partners' : ($volunteer ? 'volunteer' : ($events ? 'events' : ($courses ? 'courses' : ($people ? 'people' : 'updates')))),
            'canPublish' => current_user_can($partners ? Sonnenblume_Partners::PUBLISH : ($volunteer ? Sonnenblume_Volunteer::PUBLISH : ($events ? Sonnenblume_Events::PUBLISH : ($courses ? Sonnenblume_Courses::PUBLISH : ($people ? Sonnenblume_People::PUBLISH : static::PUBLISH))))), 'userName' => wp_get_current_user()->display_name,
            'teacherOptions' => $courses ? Sonnenblume_Courses::teacher_options() : [],
            'courseOptions' => $events ? Sonnenblume_Events::course_options() : [],
        ]) . ';', 'before');
    }

    public static function media_query($query) {
        if (current_user_can(static::EDIT) && !current_user_can(static::EDIT_OTHERS)) $query['author'] = get_current_user_id();
        return $query;
    }

    public static function media_mimes($mimes) {
        if (current_user_can(static::EDIT) && !current_user_can('manage_options')) {
            return array_intersect_key($mimes, array_flip(['jpg|jpeg|jpe', 'png', 'webp', 'avif']));
        }
        return $mimes;
    }
}

require_once __DIR__ . '/people.php';
require_once __DIR__ . '/courses.php';
require_once __DIR__ . '/events.php';
require_once __DIR__ . '/volunteer.php';
require_once __DIR__ . '/partners.php';
require_once __DIR__ . '/operations.php';

register_activation_hook(__FILE__, [Sonnenblume_Content::class, 'install']);
add_action('init', [Sonnenblume_Content::class, 'boot']);
add_action('rest_api_init', [Sonnenblume_Content::class, 'routes']);
add_action('admin_menu', [Sonnenblume_Content::class, 'menu']);
add_action('admin_enqueue_scripts', [Sonnenblume_Content::class, 'assets']);
add_filter('ajax_query_attachments_args', [Sonnenblume_Content::class, 'media_query']);
add_filter('upload_mimes', [Sonnenblume_Content::class, 'media_mimes']);
add_action('init', [Sonnenblume_People::class, 'boot']);
add_action('rest_api_init', [Sonnenblume_People::class, 'routes']);
add_action('admin_menu', [Sonnenblume_People::class, 'menu']);
add_action('init', [Sonnenblume_Courses::class, 'boot']);
add_action('rest_api_init', [Sonnenblume_Courses::class, 'routes']);
add_action('admin_menu', [Sonnenblume_Courses::class, 'menu']);
add_action('init', [Sonnenblume_Events::class, 'boot']);
add_action('rest_api_init', [Sonnenblume_Events::class, 'routes']);
add_action('admin_menu', [Sonnenblume_Events::class, 'menu']);
add_action('init', [Sonnenblume_Volunteer::class, 'boot']);
add_action('rest_api_init', [Sonnenblume_Volunteer::class, 'routes']);
add_action('admin_menu', [Sonnenblume_Volunteer::class, 'menu']);
add_action('init', [Sonnenblume_Partners::class, 'boot']);
add_action('rest_api_init', [Sonnenblume_Partners::class, 'routes']);
add_action('admin_menu', [Sonnenblume_Partners::class, 'menu']);
add_action('rest_api_init', [Sonnenblume_Operations::class, 'routes']);
add_action('admin_menu', [Sonnenblume_Operations::class, 'menu']);
add_action('admin_post_snb_operations_action', [Sonnenblume_Operations::class, 'admin_action']);
add_action('admin_post_snb_operations_export', [Sonnenblume_Operations::class, 'export']);
