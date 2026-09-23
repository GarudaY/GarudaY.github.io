<?php
defined('ABSPATH') || exit;

final class Sonnenblume_Operations {
    const MANAGE = 'snb_manage_operations';
    const MAX_CONTACTS = 5000;
    const MAX_REGISTRATIONS = 10000;

    private static function contacts_table() {
        global $wpdb;
        return $wpdb->prefix . 'snb_contacts';
    }

    private static function registrations_table() {
        global $wpdb;
        return $wpdb->prefix . 'snb_registrations';
    }

    public static function install() {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $charset = $wpdb->get_charset_collate();
        $contacts = static::contacts_table();
        $registrations = static::registrations_table();
        dbDelta("CREATE TABLE $contacts (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            uuid char(36) NOT NULL,
            reference varchar(32) NOT NULL,
            locale char(2) NOT NULL,
            name varchar(100) NOT NULL,
            email varchar(200) NOT NULL,
            topic varchar(32) NOT NULL,
            message text NOT NULL,
            message_hash char(64) NOT NULL,
            context varchar(240) NOT NULL DEFAULT '',
            status varchar(20) NOT NULL DEFAULT 'new',
            notification_status varchar(20) NOT NULL DEFAULT 'pending',
            notification_target varchar(200) NOT NULL,
            notification_error varchar(190) NOT NULL DEFAULT '',
            consent_at datetime NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY reference (reference),
            KEY status_created (status, created_at),
            KEY duplicate_check (email, message_hash, created_at)
        ) $charset;");
        dbDelta("CREATE TABLE $registrations (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            uuid char(36) NOT NULL,
            reference varchar(32) NOT NULL,
            token_hash char(64) NOT NULL,
            event_id varchar(120) NOT NULL,
            event_slug varchar(120) NOT NULL,
            event_title varchar(200) NOT NULL,
            locale char(2) NOT NULL,
            name varchar(100) NOT NULL,
            email varchar(200) NOT NULL,
            participants smallint(5) unsigned NOT NULL,
            group_kind varchar(20) NOT NULL,
            note text NOT NULL,
            status varchar(20) NOT NULL,
            notification_status varchar(20) NOT NULL DEFAULT 'pending',
            notification_target varchar(200) NOT NULL,
            notification_error varchar(190) NOT NULL DEFAULT '',
            consent_at datetime NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            cancelled_at datetime NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY reference (reference),
            UNIQUE KEY token_hash (token_hash),
            KEY event_status_created (event_slug, status, created_at),
            KEY duplicate_registration (event_slug, email, status)
        ) $charset;");
    }

    public static function routes() {
        register_rest_route(Sonnenblume_Content::NS, '/contact', [
            ['methods' => 'POST', 'callback' => [static::class, 'create_contact'], 'permission_callback' => '__return_true'],
        ]);
        register_rest_route(Sonnenblume_Content::NS, '/registrations', [
            ['methods' => 'GET', 'callback' => [static::class, 'availability'], 'permission_callback' => '__return_true'],
            ['methods' => 'POST', 'callback' => [static::class, 'create_registration'], 'permission_callback' => '__return_true'],
        ]);
        register_rest_route(Sonnenblume_Content::NS, '/registrations/(?P<token>[a-f0-9]{64})', [
            ['methods' => 'GET', 'callback' => [static::class, 'registration_status'], 'permission_callback' => '__return_true'],
            ['methods' => 'DELETE', 'callback' => [static::class, 'cancel_registration'], 'permission_callback' => '__return_true'],
        ]);
    }

    private static function error($code, $status = 400) {
        return new WP_Error($code, $code, ['status' => $status]);
    }

    private static function body($request) {
        $body = $request->get_json_params();
        return is_array($body) ? $body : [];
    }

    private static function text($value, $max, $multiline = false) {
        if (!is_string($value)) return null;
        $value = trim($multiline ? sanitize_textarea_field($value) : sanitize_text_field($value));
        if (mb_strlen($value) > $max) return null;
        return $value;
    }

    private static function limited($scope, $limit = 8, $seconds = 600) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $key = 'snb_rate_' . md5($scope . '|' . $ip . '|' . wp_salt('nonce'));
        $count = (int) get_transient($key);
        if ($count >= $limit) return true;
        set_transient($key, $count + 1, $seconds);
        return false;
    }

    private static function reference($prefix) {
        return $prefix . '-' . gmdate('Ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
    }

    private static function topic_target($topic) {
        $targets = [
            'general' => 'kontakt@sonnenblume-mg.com',
            'courses' => 'kurse@sonnenblume-mg.com',
            'events' => 'kurse@sonnenblume-mg.com',
            'volunteering' => 'vorstand@sonnenblume-mg.com',
            'membership' => 'vorstand@sonnenblume-mg.com',
            'donation' => 'vorstand@sonnenblume-mg.com',
            'partnership' => 'vorstand@sonnenblume-mg.com',
        ];
        return $targets[$topic] ?? $targets['general'];
    }

    private static function send_notification($target, $subject, $body, $reply_email, $reply_name) {
        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            'Reply-To: ' . $reply_name . ' <' . $reply_email . '>',
        ];
        return wp_mail($target, $subject, $body, $headers);
    }

    public static function create_contact($request) {
        global $wpdb;
        if (static::limited('contact')) return static::error('rate_limited', 429);
        $body = static::body($request);
        if (!empty($body['company'])) return static::error('invalid_contact');
        $locale = in_array($body['locale'] ?? '', ['uk', 'de'], true) ? $body['locale'] : null;
        $name = static::text($body['name'] ?? null, 100);
        $email = sanitize_email($body['email'] ?? '');
        $topic = $body['topic'] ?? '';
        $topics = ['general', 'courses', 'events', 'volunteering', 'membership', 'donation', 'partnership'];
        $message = static::text($body['message'] ?? null, 3000, true);
        $context = static::text($body['context'] ?? '', 240) ?? '';
        if (!$locale || !$name || mb_strlen($name) < 2 || !$email || !is_email($email) || !in_array($topic, $topics, true) || !$message || mb_strlen($message) < 5 || ($body['consent'] ?? false) !== true || ($topic === 'membership' && ($body['statuteAccepted'] ?? false) !== true)) {
            return static::error('invalid_contact');
        }
        $table = static::contacts_table();
        $hash = hash('sha256', $message);
        $recent = gmdate('Y-m-d H:i:s', time() - 600);
        if ($wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE email = %s AND message_hash = %s AND created_at >= %s LIMIT 1", strtolower($email), $hash, $recent))) {
            return static::error('duplicate_contact', 409);
        }
        if ((int) $wpdb->get_var("SELECT COUNT(*) FROM $table") >= static::MAX_CONTACTS) return static::error('storage_unavailable', 503);
        $now = current_time('mysql', true);
        $reference = static::reference('MSG');
        $target = static::topic_target($topic);
        $inserted = $wpdb->insert($table, [
            'uuid' => wp_generate_uuid4(), 'reference' => $reference, 'locale' => $locale,
            'name' => $name, 'email' => strtolower($email), 'topic' => $topic,
            'message' => $message, 'message_hash' => $hash, 'context' => $context,
            'status' => 'new', 'notification_status' => 'pending', 'notification_target' => $target,
            'consent_at' => $now, 'created_at' => $now, 'updated_at' => $now,
        ], ['%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s']);
        if (!$inserted) return static::error('storage_unavailable', 503);
        $mail_body = "Reference: $reference\nTopic: $topic\nLanguage: $locale\nName: $name\nEmail: $email\nContext: $context\n\n$message";
        $sent = static::send_notification($target, "Website request $reference", $mail_body, $email, $name);
        $notification = $sent ? 'sent' : 'failed';
        $wpdb->update($table, [
            'notification_status' => $notification,
            'notification_error' => $sent ? '' : 'wp_mail_failed',
            'updated_at' => current_time('mysql', true),
        ], ['reference' => $reference], ['%s','%s','%s'], ['%s']);
        return new WP_REST_Response(['reference' => $reference, 'status' => 'new', 'notificationStatus' => $notification], 201, ['Cache-Control' => 'no-store']);
    }

    private static function event($slug) {
        foreach (get_posts(['post_type' => Sonnenblume_Events::TYPE, 'post_status' => 'draft', 'numberposts' => 200]) as $post) {
            $state = json_decode((string) get_post_meta($post->ID, Sonnenblume_Content::META, true), true);
            $event = $state['live'] ?? null;
            if ($event && empty($state['archived']) && ($event['slug'] ?? '') === $slug) return $event;
        }
        return null;
    }

    private static function availability_data($event) {
        global $wpdb;
        $table = static::registrations_table();
        $row = $wpdb->get_row($wpdb->prepare("SELECT COALESCE(SUM(CASE WHEN status = 'confirmed' THEN participants ELSE 0 END), 0) confirmed, COALESCE(SUM(CASE WHEN status = 'waitlist' THEN participants ELSE 0 END), 0) waitlist FROM $table WHERE event_slug = %s", $event['slug']), ARRAY_A);
        $confirmed = (int) ($row['confirmed'] ?? 0);
        $available = max(0, (int) ($event['seatsAvailable'] ?? $event['capacity'] ?? 0) - $confirmed);
        return [
            'eventSlug' => $event['slug'],
            'capacity' => (int) ($event['capacity'] ?? 0),
            'remainingSeats' => $available,
            'confirmedParticipants' => $confirmed,
            'waitlistPeople' => (int) ($row['waitlist'] ?? 0),
        ];
    }

    public static function availability($request) {
        $slug = sanitize_title($request->get_param('event'));
        $event = static::event($slug);
        if (!$event || ($event['eventStatus'] ?? '') !== 'upcoming' || (int) ($event['capacity'] ?? 0) < 1) return static::error('event_unavailable', 404);
        return new WP_REST_Response(static::availability_data($event), 200, ['Cache-Control' => 'no-store']);
    }

    private static function lock($slug) {
        global $wpdb;
        $name = 'snb_reg_' . substr(hash('sha256', $slug), 0, 40);
        return [$name, (int) $wpdb->get_var($wpdb->prepare('SELECT GET_LOCK(%s, 5)', $name)) === 1];
    }

    private static function unlock($name) {
        global $wpdb;
        $wpdb->get_var($wpdb->prepare('SELECT RELEASE_LOCK(%s)', $name));
    }

    public static function create_registration($request) {
        global $wpdb;
        if (static::limited('registration')) return static::error('rate_limited', 429);
        $body = static::body($request);
        if (!empty($body['company'])) return static::error('invalid_registration');
        $locale = in_array($body['locale'] ?? '', ['uk', 'de'], true) ? $body['locale'] : null;
        $slug = is_string($body['eventSlug'] ?? null) && preg_match('/^[a-z0-9-]{2,120}$/D', $body['eventSlug']) ? $body['eventSlug'] : null;
        $name = static::text($body['name'] ?? null, 100);
        $email = sanitize_email($body['email'] ?? '');
        $participants = filter_var($body['participants'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 5]]);
        $group = in_array($body['group'] ?? '', ['adults', 'family', 'children'], true) ? $body['group'] : null;
        $note = static::text($body['note'] ?? '', 1000, true) ?? '';
        if (!$locale || !$slug || !$name || mb_strlen($name) < 2 || !$email || !is_email($email) || $participants === false || !$group || ($body['consent'] ?? false) !== true) return static::error('invalid_registration');
        $event = static::event($slug);
        if (!$event || ($event['eventStatus'] ?? '') !== 'upcoming' || (int) ($event['capacity'] ?? 0) < 1) return static::error('event_unavailable', 404);
        [$lock, $acquired] = static::lock($slug);
        if (!$acquired) return static::error('storage_busy', 503);
        $table = static::registrations_table();
        try {
            if ((int) $wpdb->get_var("SELECT COUNT(*) FROM $table") >= static::MAX_REGISTRATIONS) return static::error('storage_unavailable', 503);
            $duplicate = $wpdb->get_var($wpdb->prepare("SELECT id FROM $table WHERE event_slug = %s AND email = %s AND status <> 'cancelled' LIMIT 1", $slug, strtolower($email)));
            if ($duplicate) return static::error('duplicate_registration', 409);
            $availability = static::availability_data($event);
            $status = $participants <= $availability['remainingSeats'] ? 'confirmed' : 'waitlist';
            $token = bin2hex(random_bytes(32));
            $reference = static::reference('REG');
            $now = current_time('mysql', true);
            $title = static::text($event['title'][$locale] ?? $event['title']['de'] ?? '', 200) ?: $slug;
            $target = 'kurse@sonnenblume-mg.com';
            $inserted = $wpdb->insert($table, [
                'uuid' => wp_generate_uuid4(), 'reference' => $reference, 'token_hash' => hash('sha256', $token),
                'event_id' => $event['contentId'] ?? 'event-' . $slug, 'event_slug' => $slug, 'event_title' => $title,
                'locale' => $locale, 'name' => $name, 'email' => strtolower($email), 'participants' => $participants,
                'group_kind' => $group, 'note' => $note, 'status' => $status,
                'notification_status' => 'pending', 'notification_target' => $target,
                'consent_at' => $now, 'created_at' => $now, 'updated_at' => $now,
            ]);
            if (!$inserted) return static::error('storage_unavailable', 503);
        } finally {
            static::unlock($lock);
        }
        $mail_body = "Reference: $reference\nEvent: $title\nStatus: $status\nName: $name\nEmail: $email\nParticipants: $participants\nGroup: $group\n\n$note";
        $sent = static::send_notification($target, "Event registration $reference", $mail_body, $email, $name);
        $notification = $sent ? 'sent' : 'failed';
        $wpdb->update($table, ['notification_status' => $notification, 'notification_error' => $sent ? '' : 'wp_mail_failed', 'updated_at' => current_time('mysql', true)], ['reference' => $reference]);
        $remaining = $status === 'confirmed' ? max(0, $availability['remainingSeats'] - $participants) : $availability['remainingSeats'];
        return new WP_REST_Response([
            'reference' => $reference, 'participants' => (int) $participants, 'status' => $status,
            'cancellationPath' => '/' . $locale . '/registration/' . $token,
            'remainingSeats' => $remaining, 'notificationStatus' => $notification,
        ], 201, ['Cache-Control' => 'no-store']);
    }

    private static function registration_by_token($token) {
        global $wpdb;
        $table = static::registrations_table();
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE token_hash = %s LIMIT 1", hash('sha256', $token)), ARRAY_A);
    }

    public static function registration_status($request) {
        $row = static::registration_by_token($request['token']);
        if (!$row) return static::error('registration_not_found', 404);
        return new WP_REST_Response([
            'reference' => $row['reference'], 'eventSlug' => $row['event_slug'], 'eventTitle' => $row['event_title'],
            'participants' => (int) $row['participants'], 'status' => $row['status'],
            'createdAt' => mysql_to_rfc3339($row['created_at']),
            'cancelledAt' => $row['cancelled_at'] ? mysql_to_rfc3339($row['cancelled_at']) : null,
        ], 200, ['Cache-Control' => 'no-store']);
    }

    private static function promote_waitlist($event) {
        global $wpdb;
        $table = static::registrations_table();
        $remaining = static::availability_data($event)['remainingSeats'];
        $rows = $wpdb->get_results($wpdb->prepare("SELECT id, participants FROM $table WHERE event_slug = %s AND status = 'waitlist' ORDER BY created_at ASC, id ASC", $event['slug']), ARRAY_A);
        foreach ($rows as $row) {
            $participants = (int) $row['participants'];
            if ($participants > $remaining) break;
            $wpdb->update($table, ['status' => 'confirmed', 'updated_at' => current_time('mysql', true)], ['id' => (int) $row['id']]);
            $remaining -= $participants;
        }
    }

    public static function cancel_registration($request) {
        global $wpdb;
        $row = static::registration_by_token($request['token']);
        if (!$row) return static::error('registration_not_found', 404);
        if ($row['status'] === 'cancelled') return new WP_REST_Response(['reference' => $row['reference'], 'status' => 'cancelled'], 200, ['Cache-Control' => 'no-store']);
        [$lock, $acquired] = static::lock($row['event_slug']);
        if (!$acquired) return static::error('storage_busy', 503);
        try {
            $now = current_time('mysql', true);
            $wpdb->update(static::registrations_table(), ['status' => 'cancelled', 'cancelled_at' => $now, 'updated_at' => $now], ['id' => (int) $row['id']]);
            $event = static::event($row['event_slug']);
            if ($event) static::promote_waitlist($event);
        } finally {
            static::unlock($lock);
        }
        return new WP_REST_Response(['reference' => $row['reference'], 'status' => 'cancelled'], 200, ['Cache-Control' => 'no-store']);
    }

    public static function menu() {
        add_submenu_page('sonnenblume-content', 'Заявки — SONNENBLUME', 'Заявки', static::MANAGE, 'sonnenblume-operations', [static::class, 'page']);
    }

    public static function admin_action() {
        if (!current_user_can(static::MANAGE)) wp_die('Forbidden', 403);
        check_admin_referer('snb_operations_action');
        global $wpdb;
        $kind = sanitize_key($_POST['kind'] ?? '');
        $id = absint($_POST['id'] ?? 0);
        if ($kind === 'contact') {
            $status = sanitize_key($_POST['status'] ?? '');
            if (in_array($status, ['new', 'in_progress', 'resolved'], true)) $wpdb->update(static::contacts_table(), ['status' => $status, 'updated_at' => current_time('mysql', true)], ['id' => $id]);
        } elseif ($kind === 'registration') {
            $row = $wpdb->get_row($wpdb->prepare('SELECT * FROM ' . static::registrations_table() . ' WHERE id = %d', $id), ARRAY_A);
            if ($row && $row['status'] !== 'cancelled') {
                $now = current_time('mysql', true);
                $wpdb->update(static::registrations_table(), ['status' => 'cancelled', 'cancelled_at' => $now, 'updated_at' => $now], ['id' => $id]);
                $event = static::event($row['event_slug']);
                if ($event) static::promote_waitlist($event);
            }
        }
        wp_safe_redirect(admin_url('admin.php?page=sonnenblume-operations&updated=1'));
        exit;
    }

    public static function export() {
        if (!current_user_can(static::MANAGE)) wp_die('Forbidden', 403);
        check_admin_referer('snb_operations_export');
        global $wpdb;
        $kind = ($_GET['kind'] ?? '') === 'registrations' ? 'registrations' : 'contacts';
        $table = $kind === 'registrations' ? static::registrations_table() : static::contacts_table();
        $rows = $wpdb->get_results("SELECT * FROM $table ORDER BY created_at DESC LIMIT 10000", ARRAY_A);
        nocache_headers();
        header('Content-Type: text/csv; charset=UTF-8');
        header('Content-Disposition: attachment; filename="sonnenblume-' . $kind . '-' . gmdate('Y-m-d') . '.csv"');
        $out = fopen('php://output', 'w');
        fwrite($out, "\xEF\xBB\xBF");
        if ($rows) {
            $columns = array_values(array_filter(array_keys($rows[0]), fn($column) => $column !== 'token_hash'));
            fputcsv($out, $columns, ';');
            foreach ($rows as $row) fputcsv($out, array_map(fn($column) => $row[$column], $columns), ';');
        }
        fclose($out);
        exit;
    }

    public static function page() {
        if (!current_user_can(static::MANAGE)) return;
        global $wpdb;
        $contacts = $wpdb->get_results('SELECT * FROM ' . static::contacts_table() . ' ORDER BY created_at DESC LIMIT 200', ARRAY_A);
        $registrations = $wpdb->get_results('SELECT * FROM ' . static::registrations_table() . ' ORDER BY created_at DESC LIMIT 200', ARRAY_A);
        $action = admin_url('admin-post.php');
        echo '<div class="wrap"><h1>Заявки SONNENBLUME</h1><p>Контактні звернення та реєстрації зберігаються тут незалежно від доставки email.</p>';
        echo '<p><a class="button" href="' . esc_url(wp_nonce_url($action . '?action=snb_operations_export&kind=contacts', 'snb_operations_export')) . '">CSV звернень</a> <a class="button" href="' . esc_url(wp_nonce_url($action . '?action=snb_operations_export&kind=registrations', 'snb_operations_export')) . '">CSV реєстрацій</a></p>';
        echo '<h2>Реєстрації</h2><div style="overflow:auto"><table class="widefat striped"><thead><tr><th>Дата</th><th>Номер</th><th>Подія</th><th>Контакт</th><th>Людей</th><th>Статус</th><th>Email</th><th></th></tr></thead><tbody>';
        if (!$registrations) echo '<tr><td colspan="8">Реєстрацій ще немає.</td></tr>';
        foreach ($registrations as $row) {
            echo '<tr><td>' . esc_html($row['created_at']) . '</td><td><code>' . esc_html($row['reference']) . '</code></td><td>' . esc_html($row['event_title']) . '</td><td>' . esc_html($row['name']) . '<br><a href="mailto:' . esc_attr($row['email']) . '">' . esc_html($row['email']) . '</a></td><td>' . (int) $row['participants'] . '</td><td>' . esc_html($row['status']) . '</td><td>' . esc_html($row['notification_status']) . '</td><td>';
            if ($row['status'] !== 'cancelled') echo '<form method="post" action="' . esc_url($action) . '"><input type="hidden" name="action" value="snb_operations_action"><input type="hidden" name="kind" value="registration"><input type="hidden" name="id" value="' . (int) $row['id'] . '">' . wp_nonce_field('snb_operations_action', '_wpnonce', true, false) . '<button class="button" type="submit">Скасувати</button></form>';
            echo '</td></tr>';
        }
        echo '</tbody></table></div><h2 style="margin-top:32px">Звернення</h2><div style="overflow:auto"><table class="widefat striped"><thead><tr><th>Дата</th><th>Номер</th><th>Тема</th><th>Контакт</th><th>Повідомлення</th><th>Email</th><th>Статус</th></tr></thead><tbody>';
        if (!$contacts) echo '<tr><td colspan="7">Звернень ще немає.</td></tr>';
        foreach ($contacts as $row) {
            echo '<tr><td>' . esc_html($row['created_at']) . '</td><td><code>' . esc_html($row['reference']) . '</code></td><td>' . esc_html($row['topic']) . '<br><small>' . esc_html($row['context']) . '</small></td><td>' . esc_html($row['name']) . '<br><a href="mailto:' . esc_attr($row['email']) . '">' . esc_html($row['email']) . '</a></td><td style="max-width:420px;white-space:pre-wrap">' . esc_html($row['message']) . '</td><td>' . esc_html($row['notification_status']) . '</td><td><form method="post" action="' . esc_url($action) . '"><input type="hidden" name="action" value="snb_operations_action"><input type="hidden" name="kind" value="contact"><input type="hidden" name="id" value="' . (int) $row['id'] . '">' . wp_nonce_field('snb_operations_action', '_wpnonce', true, false) . '<select name="status"><option value="new"' . selected($row['status'], 'new', false) . '>Нове</option><option value="in_progress"' . selected($row['status'], 'in_progress', false) . '>У роботі</option><option value="resolved"' . selected($row['status'], 'resolved', false) . '>Завершено</option></select> <button class="button" type="submit">Зберегти</button></form></td></tr>';
        }
        echo '</tbody></table></div></div>';
    }
}
