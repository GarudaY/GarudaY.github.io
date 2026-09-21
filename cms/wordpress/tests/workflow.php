<?php
// Executed inside a disposable WordPress Playground, never installed as a plugin.
require '/wordpress/wp-load.php';

$checks = [];
function check($condition, $name) {
    global $checks;
    if (!$condition) throw new Exception('FAILED: ' . $name);
    $checks[] = $name;
}
function api($user, $method, $path, $body = null) {
    wp_set_current_user($user);
    $request = new WP_REST_Request($method, '/sonnenblume/v1/' . $path);
    if ($body !== null) {
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode($body));
    }
    $response = rest_do_request($request);
    return [$response->get_status(), $response->get_data()];
}
function session($id) {
    wp_set_current_user($id);
    $expires = time() + 3600;
    $token = WP_Session_Tokens::get_instance($id)->create($expires);
    $logged = wp_generate_auth_cookie($id, $expires, 'logged_in', $token);
    $_COOKIE[LOGGED_IN_COOKIE] = $logged;
    return ['cookie' => LOGGED_IN_COOKIE . '=' . $logged . '; ' . AUTH_COOKIE . '=' . wp_generate_auth_cookie($id, $expires, 'auth', $token), 'nonce' => wp_create_nonce('wp_rest')];
}

try {
    $author = wp_insert_user(['user_login' => 'test-author-a', 'user_pass' => bin2hex(random_bytes(24)), 'role' => 'snb_author', 'display_name' => 'Test Author']);
    $other = wp_insert_user(['user_login' => 'test-author-b', 'user_pass' => bin2hex(random_bytes(24)), 'role' => 'snb_author']);
    $editor = wp_insert_user(['user_login' => 'test-editor', 'user_pass' => bin2hex(random_bytes(24)), 'role' => 'snb_editor']);
    $subscriber = wp_insert_user(['user_login' => 'test-subscriber', 'user_pass' => bin2hex(random_bytes(24)), 'role' => 'subscriber']);
    check(!is_wp_error($author) && !is_wp_error($editor), 'native WordPress author/editor accounts created in isolated test DB');
    foreach ([$author, $editor] as $user) {
        wp_set_current_user($user);
        check(!current_user_can('manage_options') && !current_user_can('edit_users') && !current_user_can('activate_plugins') && !current_user_can('unfiltered_html'), 'editorial roles cannot manage site, users, plugins or raw HTML');
    }
    check(api(0, 'GET', 'updates')[0] === 401, 'anonymous cannot read editorial feed');
    check(api($subscriber, 'GET', 'updates')[0] === 403, 'normal subscriber cannot read editorial feed');
    $data = ['title' => ['uk' => 'Нова «майстерня»', 'de' => 'Neue "Werkstatt"'], 'status' => ['uk' => 'Готуємо проєкт', 'de' => 'In Vorbereitung'], 'text' => ['uk' => "Текст з апострофом: п’ять.\nДруга строка.", 'de' => "Text with \\ and \"quotes\"."], 'icon' => 'lightbulb', 'order' => 10, 'imageId' => 0, 'imageAlt' => ['uk' => '', 'de' => ''], 'imageFocus' => 50, 'isExample' => false];
    [$code, $created] = api($author, 'POST', 'updates', ['action' => 'save', 'data' => $data]);
    check($code === 201, 'author creates draft');
    $id = $created['id'];
    check(api(0, 'GET', 'updates/public')[1]['items'] === [], 'draft never appears publicly');
    check(api($other, 'GET', 'updates/' . $id)[0] === 403, 'other author cannot read private draft');
    check(count(api($other, 'GET', 'updates')[1]['items']) === 0, 'author list excludes other authors');
    check(api($other, 'POST', 'updates/' . $id, ['action' => 'save', 'revision' => 1, 'data' => $data])[0] === 403, 'other author cannot edit draft');
    check(api($author, 'POST', 'updates/' . $id, ['action' => 'publish', 'revision' => 1, 'data' => $data])[0] === 403, 'author cannot publish');
    [$code, $review] = api($author, 'POST', 'updates/' . $id, ['action' => 'submit', 'revision' => 1, 'data' => $data]);
    check($code === 200 && $review['workflow'] === 'review', 'author submits for review');
    $broken = $data; $broken['title']['de'] = '';
    check(api($editor, 'POST', 'updates/' . $id, ['action' => 'publish', 'revision' => 2, 'data' => $broken])[0] === 400, 'publication requires both languages');
    [$code, $published] = api($editor, 'POST', 'updates/' . $id, ['action' => 'publish', 'revision' => 2, 'data' => $data]);
    check($code === 200 && $published['hasLive'], 'editor publishes reviewed draft');
    $public = api(0, 'GET', 'updates/public')[1]['items'];
    check(count($public) === 1 && $public[0]['text'] === $data['text'], 'bilingual quotes, apostrophe, backslash and linebreaks survive storage');
    check(!isset($public[0]['history']) && !isset($public[0]['authorId']) && !isset($public[0]['data']), 'public API does not disclose drafts/history/user data');
    $changed = $data; $changed['title']['uk'] = 'Неопубліковані зміни';
    [$code, $draft] = api($author, 'POST', 'updates/' . $id, ['action' => 'save', 'revision' => 3, 'data' => $changed]);
    check($code === 200 && $draft['hasChanges'], 'author edits live item into separate working draft');
    check(api(0, 'GET', 'updates/public')[1]['items'][0]['title']['uk'] === $data['title']['uk'], 'saving live-item draft does not change published snapshot');
    check(api($editor, 'POST', 'updates/' . $id, ['action' => 'publish', 'revision' => 3, 'data' => $changed])[0] === 409, 'stale revision rejected without overwriting');
    check(api($author, 'POST', 'updates/' . $id, ['action' => 'restore', 'revision' => 4, 'targetRevision' => 3])[0] === 403, 'author cannot restore audit history');
    [$code, $restored] = api($editor, 'POST', 'updates/' . $id, ['action' => 'restore', 'revision' => 4, 'targetRevision' => 3]);
    check($code === 200 && $restored['data']['title'] === $data['title'], 'editor restores old version into draft, not automatic publication');
    check(api($editor, 'POST', 'updates/' . $id, ['action' => 'archive', 'revision' => 5])[0] === 200, 'editor archives without deleting history');
    check(api(0, 'GET', 'updates/public')[1]['items'] === [], 'archived item absent publicly');
    check(api($author, 'POST', 'updates/' . $id, ['action' => 'save', 'revision' => 6, 'data' => $changed])[0] === 403, 'author cannot resurrect archived item');
    check(api($editor, 'POST', 'updates/' . $id, ['action' => 'publish', 'revision' => 6, 'data' => $data])[0] === 200, 'editor can republish archived item');
    $bad = $data; $bad['icon'] = 'arbitrary';
    check(api($author, 'POST', 'updates', ['data' => $bad])[0] === 400, 'unknown icon rejected');
    $bad = $data; $bad['order'] = 1.5;
    check(api($author, 'POST', 'updates', ['data' => $bad])[0] === 400, 'noninteger display order rejected');
    $bad = $data; $bad['title']['uk'] = str_repeat('x', 161);
    check(api($author, 'POST', 'updates', ['data' => $bad])[0] === 400, 'oversized title rejected');
    $bad = $data; $bad['imageId'] = 999999;
    check(api($author, 'POST', 'updates', ['data' => $bad])[0] === 400, 'nonexistent media ID rejected');
    $bad = $data; $bad['title'] = 'not a translation object';
    check(api($author, 'POST', 'updates', ['data' => $bad])[0] === 400, 'malformed translation shape rejected, not PHP error');
    $bad = $data; $bad['isExample'] = 'yes';
    check(api($author, 'POST', 'updates', ['data' => $bad])[0] === 400, 'malformed example marker rejected');
    $bad = $data; $bad['title']['uk'] = '<img src=x onerror=alert(1)>Безпечний текст';
    [$code, $safe] = api($author, 'POST', 'updates', ['data' => $bad]);
    check($code === 201 && $safe['data']['title']['uk'] === 'Безпечний текст', 'raw HTML sanitized on write');
    wp_set_current_user($editor);
    $mimes = apply_filters('upload_mimes', get_allowed_mime_types());
    check(!isset($mimes['svg']) && !isset($mimes['php']) && !isset($mimes['pdf']), 'editorial uploads limited to safe raster image formats');
    wp_set_current_user($author);
    check(apply_filters('ajax_query_attachments_args', [])['author'] === $author, 'native author media library restricted to own uploads');
    wp_set_current_user($editor);
    check(!isset(apply_filters('ajax_query_attachments_args', [])['author']), 'editor can choose shared media library');
    $request = new WP_REST_Request('GET', '/wp/v2/snb_update');
    check(rest_do_request($request)->get_status() === 404, 'core CPT REST endpoint cannot bypass publication workflow');
    check(api(0, 'GET', 'people')[0] === 401 && api($subscriber, 'GET', 'people')[0] === 403, 'people editorial feed requires an editorial account');
    $person = ['slug' => 'fixture-volunteer', 'name' => ['uk' => 'Тестовий волонтер', 'de' => 'Testperson'], 'roleLabel' => ['uk' => 'Активний волонтер', 'de' => 'Ehrenamt'], 'bio' => ['uk' => "Тестовий опис.\nДруга строка.", 'de' => 'Testbeschreibung'], 'teacherRoleLabel' => ['uk' => '', 'de' => ''], 'teacherBio' => ['uk' => '', 'de' => ''], 'roles' => ['volunteer'], 'boardPosition' => null, 'languages' => ['uk', 'de'], 'order' => 10, 'imageId' => 0, 'imageAlt' => ['uk' => '', 'de' => ''], 'imageFocus' => 35, 'publicationPermission' => true];
    [$code, $personDraft] = api($author, 'POST', 'people', ['action' => 'save', 'data' => $person]);
    check($code === 201 && $personDraft['data']['contentId'] === 'person-fixture-volunteer', 'volunteer draft gets a stable course-compatible identity without membership');
    $personId = $personDraft['id'];
    check(api(0, 'GET', 'people/public')[1]['items'] === [], 'people drafts do not appear publicly');
    check(api($other, 'GET', 'people/' . $personId)[0] === 403 && count(api($other, 'GET', 'people')[1]['items']) === 0, 'other author cannot read another private profile');
    check(api($other, 'POST', 'people/' . $personId, ['action' => 'save', 'revision' => 1, 'data' => $person])[0] === 403, 'other author cannot edit another profile');
    check(api($author, 'POST', 'people/' . $personId, ['action' => 'publish', 'revision' => 1, 'data' => $person])[0] === 403, 'author cannot publish profiles');
    check(api($author, 'POST', 'people/' . $personId, ['action' => 'submit', 'revision' => 1, 'data' => $person])[1]['workflow'] === 'review', 'author can submit a profile for review');
    $bad = $person; $bad['publicationPermission'] = false;
    check(api($editor, 'POST', 'people/' . $personId, ['action' => 'publish', 'revision' => 2, 'data' => $bad])[0] === 400, 'profile publication requires explicit permission confirmation');
    $bad = $person; $bad['bio']['de'] = '';
    check(api($editor, 'POST', 'people/' . $personId, ['action' => 'publish', 'revision' => 2, 'data' => $bad])[0] === 400, 'profile publication requires both languages');
    [$code, $personPublished] = api($editor, 'POST', 'people/' . $personId, ['action' => 'publish', 'revision' => 2, 'data' => $person]);
    check($code === 200 && $personPublished['hasLive'], 'editor publishes reviewed volunteer profile');
    $publicPerson = api(0, 'GET', 'people/public')[1]['items'][0];
    check($publicPerson['id'] === 'person-fixture-volunteer' && $publicPerson['bio'] === $person['bio'], 'public profile keeps stable identity and multiline bilingual biography');
    check(!isset($publicPerson['publicationPermission']) && !isset($publicPerson['authorId']) && !isset($publicPerson['history']) && !isset($publicPerson['live']), 'public profiles disclose no permission markers, account data or drafts');
    $changedPerson = $person; $changedPerson['name']['uk'] = 'Неопубліковане ім’я';
    check(api($author, 'POST', 'people/' . $personId, ['action' => 'save', 'revision' => 3, 'data' => $changedPerson])[0] === 200, 'live profile can receive a separate working draft');
    check(api(0, 'GET', 'people/public')[1]['items'][0]['name']['uk'] === $person['name']['uk'], 'profile draft never changes the live snapshot');
    check(api($editor, 'POST', 'people/' . $personId, ['action' => 'publish', 'revision' => 3, 'data' => $person])[0] === 409, 'stale profile revision is rejected');
    $bad = $person; $bad['slug'] = 'changed-address';
    check(api($editor, 'POST', 'people/' . $personId, ['action' => 'save', 'revision' => 4, 'data' => $bad])[0] === 409, 'saved profile address cannot break existing links');
    check(api($editor, 'POST', 'people', ['action' => 'save', 'data' => $person])[0] === 409, 'duplicate profile address is rejected');
    $bad = $person; $bad['roles'] = ['board']; $bad['slug'] = 'fixture-chair';
    check(api($editor, 'POST', 'people', ['action' => 'publish', 'data' => $bad])[0] === 400, 'board role requires explicit pyramid position');
    $bad['boardPosition'] = 'chair';
    [$code, $chair] = api($editor, 'POST', 'people', ['action' => 'publish', 'data' => $bad]);
    check($code === 201, 'published chair is chosen by position rather than hardcoded name');
    $bad['slug'] = 'fixture-second-chair';
    check(api($editor, 'POST', 'people', ['action' => 'publish', 'data' => $bad])[0] === 409, 'second published chair is rejected');
    $teacher = $person; $teacher['slug'] = 'fixture-teacher'; $teacher['roles'] = ['teacher'];
    check(api($editor, 'POST', 'people', ['action' => 'publish', 'data' => $teacher])[0] === 400, 'teacher requires distinct teaching description');
    $teacher['teacherRoleLabel'] = ['uk' => 'Німецька', 'de' => 'Deutsch']; $teacher['teacherBio'] = ['uk' => 'Опис викладання', 'de' => 'Kursbeschreibung'];
    $teacher['relatedCourseIds'] = ['course-injected'];
    [$code, $teacherCreated] = api($editor, 'POST', 'people', ['action' => 'publish', 'data' => $teacher]);
    check($code === 201 && $teacherCreated['data']['relatedCourseIds'] === [], 'profile writers cannot forge links to courses');
    wp_set_current_user($editor);
    $upload = wp_upload_bits('fixture-course.png', null, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='));
    $courseImage = wp_insert_attachment(['post_mime_type' => 'image/png', 'post_title' => 'Fixture course', 'post_status' => 'inherit', 'post_author' => $author], $upload['file'], 0, true);
    check(!$upload['error'] && !is_wp_error($courseImage), 'course test image stored in native media library');
    $course = [
        'slug' => 'fixture-course', 'title' => ['uk' => 'Тестовий курс', 'de' => 'Testkurs'],
        'summary' => ['uk' => 'Короткий опис', 'de' => 'Kurzbeschreibung'], 'description' => ['uk' => 'Повний опис', 'de' => 'Vollständige Beschreibung'],
        'outcomes' => ['uk' => ['Результат'], 'de' => ['Ergebnis']], 'materials' => ['uk' => [], 'de' => []],
        'ageGroup' => ['uk' => 'дорослі', 'de' => 'Erwachsene'], 'language' => ['uk' => 'українська', 'de' => 'Ukrainisch'],
        'format' => ['uk' => 'очно', 'de' => 'vor Ort'], 'location' => ['uk' => 'Mönchengladbach', 'de' => 'Mönchengladbach'],
        'schedule' => [], 'price' => ['uk' => 'безкоштовно', 'de' => 'kostenfrei'], 'startsAt' => '', 'duration' => ['uk' => 'регулярно', 'de' => 'regelmäßig'],
        'seatsTotal' => 0, 'seatsAvailable' => 0, 'teacherIds' => ['person-fixture-teacher'], 'relatedCourseIds' => [],
        'category' => 'language', 'enrollmentStatus' => 'open', 'isFeatured' => false, 'order' => 10,
        'imageId' => $courseImage, 'imageAlt' => ['uk' => 'Заняття', 'de' => 'Unterricht'], 'imageFocus' => 50,
    ];
    check(api(0, 'GET', 'courses')[0] === 401 && api($subscriber, 'GET', 'courses')[0] === 403, 'course editorial feed requires an editorial account');
    [$code, $courseDraft] = api($author, 'POST', 'courses', ['action' => 'save', 'data' => $course]);
    if ($code !== 201 || ($courseDraft['data']['contentId'] ?? null) !== 'course-fixture-course') throw new Exception('FAILED: author creates stable bilingual course draft: ' . $code . ' ' . wp_json_encode($courseDraft));
    check(true, 'author creates stable bilingual course draft');
    check(api(0, 'GET', 'courses/public')[1]['items'] === [], 'course draft stays private');
    check(api($author, 'POST', 'courses/' . $courseDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $course])[0] === 403, 'author cannot publish courses');
    $bad = $course; $bad['summary']['de'] = '';
    check(api($editor, 'POST', 'courses/' . $courseDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'course publication requires both languages');
    [$code, $coursePublished] = api($editor, 'POST', 'courses/' . $courseDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $course]);
    check($code === 200 && $coursePublished['hasLive'], 'editor publishes course with an existing teacher');
    $publicCourse = api(0, 'GET', 'courses/public')[1]['items'][0];
    check($publicCourse['id'] === 'course-fixture-course' && $publicCourse['teacherIds'] === ['person-fixture-teacher'] && !isset($publicCourse['imageId']) && !isset($publicCourse['history']), 'public course exposes only validated live content');
    $teacherFeed = array_values(array_filter(api(0, 'GET', 'people/public')[1]['items'], fn($item) => $item['id'] === 'person-fixture-teacher'))[0];
    check($teacherFeed['relatedCourseIds'] === ['course-fixture-course'], 'public teacher relationship is derived from published courses');
    check(api($editor, 'POST', 'people/' . $teacherCreated['id'], ['action' => 'archive', 'revision' => 1])[0] === 409, 'linked teacher cannot be archived leaving dangling course links');
    $teacher['roles'] = ['volunteer'];
    check(api($editor, 'POST', 'people/' . $teacherCreated['id'], ['action' => 'save', 'revision' => 1, 'data' => $teacher])[0] === 409, 'linked teacher role cannot be silently removed');
    $courseWithoutTeacher = $course; $courseWithoutTeacher['teacherIds'] = [];
    check(api($author, 'POST', 'courses/' . $courseDraft['id'], ['action' => 'save', 'revision' => 2, 'data' => $courseWithoutTeacher])[0] === 200, 'course draft can reassign a teacher without changing the live relationship');
    $teacherFeed = array_values(array_filter(api(0, 'GET', 'people/public')[1]['items'], fn($item) => $item['id'] === 'person-fixture-teacher'))[0];
    check($teacherFeed['relatedCourseIds'] === ['course-fixture-course'], 'unpublished course changes do not release teacher safeguards');
    check(api($editor, 'POST', 'courses/' . $courseDraft['id'], ['action' => 'publish', 'revision' => 3, 'data' => $courseWithoutTeacher])[0] === 200, 'published course reassignment releases previous teacher');
    $teacherFeed = array_values(array_filter(api(0, 'GET', 'people/public')[1]['items'], fn($item) => $item['id'] === 'person-fixture-teacher'))[0];
    check($teacherFeed['relatedCourseIds'] === [], 'teacher feed reflects published reassignment');
    $bad = $courseWithoutTeacher; $bad['slug'] = 'changed-course-address';
    check(api($editor, 'POST', 'courses/' . $courseDraft['id'], ['action' => 'save', 'revision' => 4, 'data' => $bad])[0] === 409, 'saved course address cannot break existing links');
    check(api($editor, 'POST', 'courses', ['action' => 'save', 'data' => $course])[0] === 409, 'archived or active course address cannot be reused');
    check(api($editor, 'POST', 'courses/' . $courseDraft['id'], ['action' => 'archive', 'revision' => 4])[0] === 200 && api(0, 'GET', 'courses/public')[1]['items'] === [], 'course can be withdrawn without deleting its history');
    $event = [
        'slug' => 'fixture-event', 'title' => ['uk' => 'Тестова подія', 'de' => 'Testveranstaltung'],
        'summary' => ['uk' => 'Короткий опис', 'de' => 'Kurzbeschreibung'],
        'description' => ['uk' => 'Повний опис', 'de' => 'Vollständige Beschreibung'],
        'dateLabel' => ['uk' => '', 'de' => ''], 'timeLabel' => ['uk' => '', 'de' => ''],
        'location' => ['uk' => 'Mönchengladbach', 'de' => 'Mönchengladbach'],
        'price' => ['uk' => 'Безкоштовно', 'de' => 'Kostenfrei'],
        'registrationLabel' => ['uk' => 'Дізнатися більше', 'de' => 'Mehr erfahren'],
        'category' => 'community', 'eventStatus' => 'upcoming', 'archiveType' => '', 'organizerName' => '',
        'startsAt' => '2026-10-18T15:00:00+02:00', 'endsAt' => '2026-10-18T17:00:00+02:00',
        'contactEmail' => 'kontakt@sonnenblume-mg.com', 'relatedCourseIds' => [],
        'gallery' => [['imageId' => $courseImage, 'imageAlt' => ['uk' => 'Люди на події', 'de' => 'Teilnehmende'], 'imageFocus' => 40]],
        'imageId' => $courseImage, 'imageAlt' => ['uk' => 'Афіша події', 'de' => 'Veranstaltungsplakat'], 'imageFocus' => 50,
        'isFeatured' => true, 'order' => 10,
    ];
    check(api(0, 'GET', 'events')[0] === 401 && api($subscriber, 'GET', 'events')[0] === 403, 'event editorial feed requires an editorial account');
    [$code, $eventDraft] = api($author, 'POST', 'events', ['action' => 'save', 'data' => $event]);
    check($code === 201 && $eventDraft['data']['contentId'] === 'event-fixture-event', 'author creates stable bilingual event draft');
    check(api(0, 'GET', 'events/public')[1]['items'] === [], 'event draft stays private');
    check(api($author, 'POST', 'events/' . $eventDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $event])[0] === 403, 'author cannot publish events');
    $bad = $event; $bad['summary']['de'] = '';
    check(api($editor, 'POST', 'events/' . $eventDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'event publication requires both languages');
    $bad = $event; $bad['startsAt'] = '2026-02-31';
    check(api($editor, 'POST', 'events/' . $eventDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'invalid event calendar date rejected');
    $bad = $event; $bad['dateLabel'] = ['uk' => 'Невдовзі', 'de' => ''];
    check(api($editor, 'POST', 'events/' . $eventDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'optional event date label requires both translations');
    $bad = $event; $bad['gallery'][0]['imageAlt']['de'] = '';
    check(api($editor, 'POST', 'events/' . $eventDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'gallery images require bilingual alt');
    [$code, $eventPublished] = api($editor, 'POST', 'events/' . $eventDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $event]);
    check($code === 200 && $eventPublished['hasLive'], 'editor publishes event with native gallery media');
    $publicEvent = api(0, 'GET', 'events/public')[1]['items'][0];
    check($publicEvent['id'] === 'event-fixture-event' && count($publicEvent['gallery']) === 1 && $publicEvent['gallery'][0]['alt']['de'] === 'Teilnehmende', 'public event keeps translated gallery');
    check($publicEvent['capacity'] === 0 && $publicEvent['seatsAvailable'] === 0 && !isset($publicEvent['imageId']) && !isset($publicEvent['history']), 'event CMS cannot forge registration capacity or disclose drafts');
    $changedEvent = $event; $changedEvent['title']['uk'] = 'Неопублікована зміна';
    check(api($author, 'POST', 'events/' . $eventDraft['id'], ['action' => 'save', 'revision' => 2, 'data' => $changedEvent])[0] === 200 && api(0, 'GET', 'events/public')[1]['items'][0]['title']['uk'] === $event['title']['uk'], 'event working draft cannot alter live page');
    $bad = $event; $bad['slug'] = 'changed-event-address';
    check(api($editor, 'POST', 'events/' . $eventDraft['id'], ['action' => 'save', 'revision' => 3, 'data' => $bad])[0] === 409, 'saved event address cannot break existing links');
    check(api($editor, 'POST', 'events', ['action' => 'save', 'data' => $event])[0] === 409, 'duplicate event address is rejected');
    check(api($editor, 'POST', 'events/' . $eventDraft['id'], ['action' => 'archive', 'revision' => 3])[0] === 200 && api(0, 'GET', 'events/public')[1]['items'] === [], 'archived event disappears without losing history');
    $request = new WP_REST_Request('GET', '/wp/v2/snb_event');
    check(rest_do_request($request)->get_status() === 404, 'core event endpoint cannot bypass workflow');
    $task = [
        'slug' => 'fixture-helper',
        'title' => ['uk' => 'Допомога на події', 'de' => 'Mithilfe beim Fest'],
        'description' => ['uk' => 'Зустрічати гостей.', 'de' => 'Gäste begrüßen.'],
        'time' => ['uk' => 'У день події', 'de' => 'Am Veranstaltungstag'],
        'location' => ['uk' => 'Мьонхенгладбах', 'de' => 'Mönchengladbach'],
        'icon' => 'calendar', 'order' => 10,
    ];
    check(api(0, 'GET', 'volunteer')[0] === 401 && api($subscriber, 'GET', 'volunteer')[0] === 403, 'volunteer editorial feed requires an editorial account');
    [$code, $taskDraft] = api($author, 'POST', 'volunteer', ['action' => 'save', 'data' => $task]);
    check($code === 201 && $taskDraft['data']['slug'] === 'fixture-helper', 'author creates volunteer task draft');
    check(api(0, 'GET', 'volunteer/public')[1]['items'] === [], 'volunteer draft stays private');
    check(api($other, 'GET', 'volunteer/' . $taskDraft['id'])[0] === 403, 'other author cannot read volunteer draft');
    check(api($author, 'POST', 'volunteer/' . $taskDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $task])[0] === 403, 'author cannot publish volunteer task');
    $bad = $task; $bad['description']['de'] = '';
    check(api($editor, 'POST', 'volunteer/' . $taskDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'volunteer task publication requires both languages');
    $bad = $task; $bad['icon'] = 'script';
    check(api($editor, 'POST', 'volunteer/' . $taskDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'volunteer task icon is allowlisted');
    [$code, $taskLive] = api($editor, 'POST', 'volunteer/' . $taskDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $task]);
    check($code === 200 && $taskLive['hasLive'], 'editor publishes volunteer task');
    $publicTask = api(0, 'GET', 'volunteer/public')[1]['items'][0];
    check($publicTask['id'] === 'fixture-helper' && $publicTask['title']['de'] === $task['title']['de'] && !isset($publicTask['history']), 'public volunteer task preserves context without private history');
    $changedTask = $task; $changedTask['title']['uk'] = 'Неопублікована зміна';
    check(api($author, 'POST', 'volunteer/' . $taskDraft['id'], ['action' => 'save', 'revision' => 2, 'data' => $changedTask])[0] === 200 && api(0, 'GET', 'volunteer/public')[1]['items'][0]['title']['uk'] === $task['title']['uk'], 'volunteer working draft cannot alter live page');
    $bad = $task; $bad['slug'] = 'renamed-helper';
    check(api($editor, 'POST', 'volunteer/' . $taskDraft['id'], ['action' => 'save', 'revision' => 3, 'data' => $bad])[0] === 409, 'saved volunteer code cannot break application context');
    check(api($editor, 'POST', 'volunteer', ['action' => 'save', 'data' => $task])[0] === 409, 'duplicate volunteer code is rejected');
    check(api($editor, 'POST', 'volunteer/' . $taskDraft['id'], ['action' => 'archive', 'revision' => 3])[0] === 200 && api(0, 'GET', 'volunteer/public')[1]['items'] === [], 'withdrawn volunteer task disappears but keeps history');
    $request = new WP_REST_Request('GET', '/wp/v2/snb_volunteer');
    check(rest_do_request($request)->get_status() === 404, 'core volunteer endpoint cannot bypass workflow');
    $thanks = [
        'slug' => 'fixture-helper', 'kind' => 'person', 'name' => 'Олена Тестова',
        'description' => ['uk' => 'Допомога громаді.', 'de' => 'Hilfe für die Gemeinschaft.'],
        'website' => '', 'order' => 10, 'imageId' => 0,
        'imageAlt' => ['uk' => '', 'de' => ''], 'imageFocus' => 50,
        'publicationPermission' => false,
    ];
    check(api(0, 'GET', 'partners')[0] === 401 && api($subscriber, 'GET', 'partners')[0] === 403, 'partner editorial feed is private');
    check(api(0, 'GET', 'partners/public')[1]['initialized'] === false, 'uninitialized partner collection is distinguishable from withdrawn content');
    [$code, $thanksDraft] = api($author, 'POST', 'partners', ['action' => 'save', 'data' => $thanks]);
    check($code === 201 && $thanksDraft['data']['slug'] === 'fixture-helper', 'author creates private thanks draft');
    check(api(0, 'GET', 'partners/public')[1]['items'] === [] && !api(0, 'GET', 'partners/public')[1]['initialized'], 'draft stays private while existing site logos remain in use');
    check(api($other, 'GET', 'partners/' . $thanksDraft['id'])[0] === 403, 'other author cannot read draft');
    check(api($author, 'POST', 'partners/' . $thanksDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $thanks])[0] === 403, 'author cannot publish private person');
    check(api($editor, 'POST', 'partners/' . $thanksDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $thanks])[0] === 400, 'person requires publication consent');
    $thanks['publicationPermission'] = true;
    $bad = $thanks; $bad['website'] = 'http://example.org/';
    check(api($editor, 'POST', 'partners/' . $thanksDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'partner website must use HTTPS');
    $bad = $thanks; $bad['kind'] = 'organization';
    check(api($editor, 'POST', 'partners/' . $thanksDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $bad])[0] === 400, 'organization requires a media-library logo');
    [$code, $thanksLive] = api($editor, 'POST', 'partners/' . $thanksDraft['id'], ['action' => 'publish', 'revision' => 1, 'data' => $thanks]);
    check($code === 200 && $thanksLive['hasLive'], 'editor publishes consented person');
    check(api(0, 'GET', 'partners/public')[1]['initialized'] === false && api($author, 'POST', 'partners/activate')[0] === 403, 'author cannot replace the existing partner list');
    check(api($editor, 'POST', 'partners/activate')[0] === 200 && api(0, 'GET', 'partners/public')[1]['initialized'], 'editor explicitly activates the reviewed CMS partner list');
    $publicThanks = api(0, 'GET', 'partners/public')[1]['items'][0];
    check($publicThanks['id'] === 'fixture-helper' && $publicThanks['kind'] === 'person' && $publicThanks['image'] === null && !isset($publicThanks['publicationPermission']) && !isset($publicThanks['history']), 'public thanks excludes consent state and history');
    $changedThanks = $thanks; $changedThanks['name'] = 'Неопублікована зміна';
    check(api($author, 'POST', 'partners/' . $thanksDraft['id'], ['action' => 'save', 'revision' => 2, 'data' => $changedThanks])[0] === 200 && api(0, 'GET', 'partners/public')[1]['items'][0]['name'] === $thanks['name'], 'partner working draft cannot alter live page');
    $bad = $thanks; $bad['slug'] = 'changed-helper';
    check(api($editor, 'POST', 'partners/' . $thanksDraft['id'], ['action' => 'save', 'revision' => 3, 'data' => $bad])[0] === 409, 'saved partner code cannot be changed');
    check(api($editor, 'POST', 'partners', ['action' => 'save', 'data' => $thanks])[0] === 409, 'duplicate partner identity rejected');
    check(api($editor, 'POST', 'partners/' . $thanksDraft['id'], ['action' => 'archive', 'revision' => 3])[0] === 200 && api(0, 'GET', 'partners/public')[1]['items'] === [], 'withdrawn thanks stay absent, even when collection is empty');
    $request = new WP_REST_Request('GET', '/wp/v2/snb_partner');
    check(rest_do_request($request)->get_status() === 404, 'core partner endpoint cannot bypass workflow');
    check(api($editor, 'POST', 'people/' . $personId, ['action' => 'restore', 'revision' => 4, 'targetRevision' => 3])[1]['data']['name'] === $person['name'], 'editor restores a profile revision into draft');
    check(api($editor, 'POST', 'people/' . $personId, ['action' => 'archive', 'revision' => 5])[0] === 200, 'unlinked volunteer profile can be withdrawn');
    check(count(api(0, 'GET', 'people/public')[1]['items']) === 2, 'withdrawn profile is absent while chair and teacher remain public');
    check(api($author, 'POST', 'people/' . $personId, ['action' => 'save', 'revision' => 6, 'data' => $person])[0] === 403, 'author cannot resurrect a withdrawn profile');
    check(api($editor, 'POST', 'people', ['action' => 'save', 'data' => $person])[0] === 409, 'withdrawn profile addresses cannot be recycled');
    foreach (['roles' => ['unknown'], 'languages' => ['private-contact@example.com'], 'publicationPermission' => 'yes', 'slug' => '../unsafe'] as $field => $value) {
        $bad = $person; $bad['slug'] = 'fixture-invalid'; $bad[$field] = $value;
        check(api($editor, 'POST', 'people', ['action' => 'save', 'data' => $bad])[0] === 400, 'malformed profile field rejected: ' . $field);
    }
    $request = new WP_REST_Request('GET', '/wp/v2/snb_person');
    check(rest_do_request($request)->get_status() === 404, 'core people endpoint cannot bypass workflow');
    $request = new WP_REST_Request('GET', '/wp/v2/snb_course');
    check(rest_do_request($request)->get_status() === 404, 'core course endpoint cannot bypass workflow');
    echo wp_json_encode(['checks' => $checks, 'author' => session($author), 'other' => session($other), 'editor' => session($editor), 'subscriber' => session($subscriber), 'liveId' => $id, 'liveRevision' => 7, 'data' => $data]);
} catch (Throwable $error) {
    echo wp_json_encode(['error' => $error->getMessage(), 'checks' => $checks]);
}
