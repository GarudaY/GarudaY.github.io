import { readFile } from "node:fs/promises";
import { startWordPress } from "./wordpress-runtime.mjs";
import { people } from "../src/content/mock/people.ts";
import { courses } from "../src/content/mock/courses.ts";
import { events } from "../src/content/mock/events.ts";
import { volunteerOpportunities } from "../src/content/mock/volunteer-opportunities.ts";
import { partners } from "../src/content/mock/partners.ts";
import sharp from "sharp";

const runtime = await startWordPress({ persistent: true });
const examples = JSON.parse(
  await readFile(
    new URL("../src/content/mock/verein-updates.json", import.meta.url),
    "utf8",
  ),
);
const encoded = Buffer.from(JSON.stringify(examples)).toString("base64");
const profiles = await Promise.all(
  people.map(async (person) => ({
    ...person,
    portrait: person.image
      ? Buffer.from(
          await readFile(
            new URL(`../public${person.image.src}`, import.meta.url),
          ),
        ).toString("base64")
      : null,
  })),
);
const encodedPeople = Buffer.from(JSON.stringify(profiles)).toString("base64");
const courseRecords = await Promise.all(
  courses.map(async (course) => ({
    ...course,
    cover: Buffer.from(
      await readFile(new URL(`../public${course.image.src}`, import.meta.url)),
    ).toString("base64"),
  })),
);
const encodedCourses = Buffer.from(JSON.stringify(courseRecords)).toString(
  "base64",
);
const eventAssetPaths = [
  ...new Set(
    events.flatMap((event) => [
      event.image.src,
      ...event.gallery.map((image) => image.src),
    ]),
  ),
];
const eventAssets = Object.fromEntries(
  await Promise.all(
    eventAssetPaths.map(async (src) => [
      src,
      Buffer.from(
        await readFile(new URL(`../public${src}`, import.meta.url)),
      ).toString("base64"),
    ]),
  ),
);
const encodedEvents = Buffer.from(JSON.stringify(events)).toString("base64");
const encodedEventAssets = Buffer.from(JSON.stringify(eventAssets)).toString(
  "base64",
);
const encodedVolunteer = Buffer.from(JSON.stringify(volunteerOpportunities)).toString("base64");
const partnerRecords = await Promise.all(partners.map(async (partner) => {
  const source = partner.logo?.src;
  const bytes = source ? await readFile(new URL(`../public${source}`, import.meta.url)) : null;
  const raster = source?.endsWith(".svg") ? await sharp(bytes).png().toBuffer() : bytes;
  return { ...partner, raster: raster?.toString("base64") ?? null, extension: source?.endsWith(".svg") ? "png" : source?.split(".").at(-1) };
}));
const encodedPartners = Buffer.from(JSON.stringify(partnerRecords)).toString("base64");
const response = await runtime.playground.run({
  code: `<?php
@unlink('/wordpress/.maintenance'); // Repair an interrupted local Playground import only.
require '/wordpress/wp-load.php';
wp_set_current_user(1);
if (!get_option('snb_demo_seeded')) {
    $items = json_decode(base64_decode('${encoded}'), true);
    foreach ($items as $item) {
        $item['imageId'] = 0; $item['imageAlt'] = ['uk' => '', 'de' => '']; $item['imageFocus'] = 50;
        $request = new WP_REST_Request('POST', '/sonnenblume/v1/updates');
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode(['action' => 'publish', 'data' => $item]));
        $result = rest_do_request($request);
        if ($result->get_status() !== 201) { echo wp_json_encode(['error' => $result->get_data()]); exit; }
    }
    update_option('snb_demo_seeded', true, false);
}
if (!get_option('snb_people_seeded')) {
    require_once ABSPATH . 'wp-admin/includes/image.php';
    foreach (json_decode(base64_decode('${encodedPeople}'), true) as $person) {
        $exists = false;
        foreach (get_posts(['post_type' => 'snb_person', 'post_status' => 'draft', 'numberposts' => 200]) as $post) {
            $state = json_decode(get_post_meta($post->ID, '_snb_state', true), true);
            if (($state['working']['slug'] ?? '') === $person['slug']) { $exists = true; break; }
        }
        if ($exists) continue; // Never replace a profile already edited in the persistent local DB.
        $image_id = 0;
        if ($person['portrait']) {
            $upload = wp_upload_bits($person['slug'] . '.webp', null, base64_decode($person['portrait']));
            if ($upload['error']) { echo wp_json_encode(['error' => 'Portrait import failed']); exit; }
            $image_id = wp_insert_attachment(['post_mime_type' => 'image/webp', 'post_title' => $person['name']['uk'], 'post_status' => 'inherit', 'post_author' => 1], $upload['file'], 0, true);
            if (is_wp_error($image_id)) { echo wp_json_encode(['error' => 'Portrait attachment failed']); exit; }
            wp_update_attachment_metadata($image_id, wp_generate_attachment_metadata($image_id, $upload['file']));
        }
        $data = [
            'slug' => $person['slug'], 'name' => $person['name'], 'roleLabel' => $person['roleLabel'], 'bio' => $person['bio'],
            'teacherRoleLabel' => $person['teacherRoleLabel'] ?? (in_array('teacher', $person['roles']) ? $person['roleLabel'] : ['uk' => '', 'de' => '']),
            'teacherBio' => $person['teacherBio'] ?? (in_array('teacher', $person['roles']) ? $person['bio'] : ['uk' => '', 'de' => '']),
            'roles' => $person['roles'], 'boardPosition' => in_array('board', $person['roles']) ? ($person['boardPosition'] ?? 'member') : null,
            'languages' => $person['languages'], 'order' => $person['order'], 'imageId' => $image_id,
            'imageAlt' => $person['image']['alt'] ?? ['uk' => '', 'de' => ''], 'imageFocus' => 50,
            'publicationPermission' => true, // Preserve profiles/photos the owner already supplied for publication; not a legal consent record.
        ];
        $request = new WP_REST_Request('POST', '/sonnenblume/v1/people');
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode(['action' => 'publish', 'data' => $data]));
        $result = rest_do_request($request);
        if ($result->get_status() !== 201) { echo wp_json_encode(['error' => $result->get_data()]); exit; }
        $id = $result->get_data()['id'];
        $state = json_decode(get_post_meta($id, '_snb_state', true), true);
        $state['working']['relatedCourseIds'] = $person['relatedCourseIds'];
        $state['live']['relatedCourseIds'] = $person['relatedCourseIds'];
        update_post_meta($id, '_snb_state', wp_slash(wp_json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)));
    }
    update_option('snb_people_seeded', true, false);
}
if (!get_option('snb_courses_seeded')) {
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $pending = [];
    foreach (json_decode(base64_decode('${encodedCourses}'), true) as $course) {
        $data = array_intersect_key($course, array_flip(['slug', 'title', 'summary', 'description', 'outcomes', 'materials', 'ageGroup', 'language', 'format', 'location', 'schedule', 'price', 'startsAt', 'duration', 'seatsTotal', 'seatsAvailable', 'teacherIds', 'relatedCourseIds', 'category', 'enrollmentStatus', 'isFeatured', 'order']));
        $existing_id = 0;
        $existing_state = null;
        foreach (get_posts(['post_type' => 'snb_course', 'post_status' => 'draft', 'numberposts' => 200]) as $post) {
            $state = json_decode(get_post_meta($post->ID, '_snb_state', true), true);
            if (($state['working']['slug'] ?? '') === $course['slug']) { $existing_id = $post->ID; $existing_state = $state; break; }
        }
        if ($existing_id && $existing_state['live']) continue; // Preserve every course already published or edited after import.
        if ($existing_id) {
            $data['imageId'] = $existing_state['working']['imageId']; $data['imageAlt'] = $course['image']['alt']; $data['imageFocus'] = $course['image']['focus'] ?? 50;
            $pending[] = ['id' => $existing_id, 'revision' => $existing_state['revision'], 'repair' => true, 'data' => $data];
            continue;
        }
        $extension = strtolower(pathinfo(parse_url($course['image']['src'], PHP_URL_PATH), PATHINFO_EXTENSION));
        $mime = $extension === 'png' ? 'image/png' : ($extension === 'webp' ? 'image/webp' : 'image/jpeg');
        $upload = wp_upload_bits($course['slug'] . '.' . $extension, null, base64_decode($course['cover']));
        if ($upload['error']) { echo wp_json_encode(['error' => 'Course cover import failed']); exit; }
        $image_id = wp_insert_attachment(['post_mime_type' => $mime, 'post_title' => $course['title']['uk'], 'post_status' => 'inherit', 'post_author' => 1], $upload['file'], 0, true);
        if (is_wp_error($image_id)) { echo wp_json_encode(['error' => 'Course attachment failed']); exit; }
        wp_update_attachment_metadata($image_id, wp_generate_attachment_metadata($image_id, $upload['file']));
        $data['imageId'] = $image_id; $data['imageAlt'] = $course['image']['alt']; $data['imageFocus'] = $course['image']['focus'] ?? 50;
        $request = new WP_REST_Request('POST', '/sonnenblume/v1/courses');
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode(['action' => 'save', 'data' => $data]));
        $result = rest_do_request($request);
        if ($result->get_status() !== 201) { echo wp_json_encode(['error' => $result->get_data()]); exit; }
        $pending[] = ['id' => $result->get_data()['id'], 'revision' => 1, 'repair' => false, 'data' => $data];
    }
    // A previous interrupted first import may contain the old derived IDs. Repair all
    // drafts before publishing, so circular related-course links resolve together.
    foreach ($pending as &$course) {
        if (!$course['repair']) continue;
        $request = new WP_REST_Request('POST', '/sonnenblume/v1/courses/' . $course['id']);
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode(['action' => 'save', 'revision' => $course['revision'], 'data' => $course['data']]));
        $result = rest_do_request($request);
        if ($result->get_status() !== 200) { echo wp_json_encode(['error' => $result->get_data()]); exit; }
        $course['revision'] = $result->get_data()['revision'];
    }
    unset($course);
    foreach ($pending as $course) {
        $request = new WP_REST_Request('POST', '/sonnenblume/v1/courses/' . $course['id']);
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode(['action' => 'publish', 'revision' => $course['revision'], 'data' => $course['data']]));
        $result = rest_do_request($request);
        if ($result->get_status() !== 200) { echo wp_json_encode(['error' => $result->get_data()]); exit; }
    }
    update_option('snb_courses_seeded', true, false);
}
if (!get_option('snb_events_seeded')) {
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $assets = json_decode(base64_decode('${encodedEventAssets}'), true);
    $attachment_ids = [];
    foreach ($assets as $source => $bytes) {
        $extension = strtolower(pathinfo(parse_url($source, PHP_URL_PATH), PATHINFO_EXTENSION));
        $mime = $extension === 'png' ? 'image/png' : ($extension === 'webp' ? 'image/webp' : 'image/jpeg');
        $name = sanitize_file_name(pathinfo($source, PATHINFO_BASENAME));
        $upload = wp_upload_bits('event-' . $name, null, base64_decode($bytes));
        if ($upload['error']) { echo wp_json_encode(['error' => 'Event image import failed']); exit; }
        $image_id = wp_insert_attachment(['post_mime_type' => $mime, 'post_title' => pathinfo($name, PATHINFO_FILENAME), 'post_status' => 'inherit', 'post_author' => 1], $upload['file'], 0, true);
        if (is_wp_error($image_id)) { echo wp_json_encode(['error' => 'Event attachment failed']); exit; }
        wp_update_attachment_metadata($image_id, wp_generate_attachment_metadata($image_id, $upload['file']));
        $attachment_ids[$source] = $image_id;
    }
    foreach (json_decode(base64_decode('${encodedEvents}'), true) as $index => $event) {
        $exists = false;
        foreach (get_posts(['post_type' => 'snb_event', 'post_status' => 'draft', 'numberposts' => 200]) as $post) {
            $state = json_decode(get_post_meta($post->ID, '_snb_state', true), true);
            if (($state['working']['slug'] ?? '') === $event['slug']) { $exists = true; break; }
        }
        if ($exists) continue;
        $data = array_intersect_key($event, array_flip(['slug', 'title', 'summary', 'description', 'dateLabel', 'timeLabel', 'location', 'price', 'registrationLabel', 'category', 'eventStatus', 'archiveType', 'organizerName', 'startsAt', 'endsAt', 'contactEmail', 'relatedCourseIds', 'isFeatured']));
        foreach (['dateLabel', 'timeLabel'] as $name) if (!isset($data[$name])) $data[$name] = ['uk' => '', 'de' => ''];
        foreach (['archiveType', 'organizerName', 'endsAt'] as $name) if (!isset($data[$name])) $data[$name] = '';
        $data['order'] = ($index + 1) * 10;
        $data['imageId'] = $attachment_ids[$event['image']['src']];
        $data['imageAlt'] = $event['image']['alt'];
        $data['imageFocus'] = $event['image']['focus'] ?? 50;
        $data['gallery'] = [];
        foreach ($event['gallery'] as $image) $data['gallery'][] = [
            'imageId' => $attachment_ids[$image['src']],
            'imageAlt' => $image['alt'],
            'imageFocus' => $image['focus'] ?? 50,
        ];
        $request = new WP_REST_Request('POST', '/sonnenblume/v1/events');
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode(['action' => 'publish', 'data' => $data]));
        $result = rest_do_request($request);
        if ($result->get_status() !== 201) { echo wp_json_encode(['error' => $result->get_data()]); exit; }
    }
    update_option('snb_events_seeded', true, false);
}
if (!get_option('snb_volunteer_seeded')) {
    foreach (json_decode(base64_decode('${encodedVolunteer}'), true) as $task) {
        $exists = false;
        foreach (get_posts(['post_type' => 'snb_volunteer', 'post_status' => 'draft', 'numberposts' => 200]) as $post) {
            $state = json_decode(get_post_meta($post->ID, '_snb_state', true), true);
            if (($state['working']['slug'] ?? '') === $task['id']) { $exists = true; break; }
        }
        if ($exists) continue;
        $data = [
            'slug' => $task['id'], 'title' => $task['title'],
            'description' => $task['description'], 'time' => $task['time'],
            'location' => $task['location'], 'icon' => $task['icon'],
            'order' => $task['order'],
        ];
        $request = new WP_REST_Request('POST', '/sonnenblume/v1/volunteer');
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode(['action' => 'publish', 'data' => $data]));
        $result = rest_do_request($request);
        if ($result->get_status() !== 201) { echo wp_json_encode(['error' => $result->get_data()]); exit; }
    }
    update_option('snb_volunteer_seeded', true, false);
}
if (!get_option('snb_partners_seeded')) {
    require_once ABSPATH . 'wp-admin/includes/image.php';
    foreach (json_decode(base64_decode('${encodedPartners}'), true) as $partner) {
        $exists = false;
        foreach (get_posts(['post_type' => 'snb_partner', 'post_status' => 'draft', 'numberposts' => 200]) as $post) {
            $state = json_decode(get_post_meta($post->ID, '_snb_state', true), true);
            if (($state['working']['slug'] ?? '') === $partner['id']) { $exists = true; break; }
        }
        if ($exists) continue;
        $image_id = 0;
        if ($partner['raster']) {
            $extension = $partner['extension'];
            $mime = $extension === 'webp' ? 'image/webp' : ($extension === 'jpg' ? 'image/jpeg' : 'image/png');
            $upload = wp_upload_bits($partner['id'] . '.' . $extension, null, base64_decode($partner['raster']));
            if ($upload['error']) { echo wp_json_encode(['error' => 'Partner logo import failed']); exit; }
            $image_id = wp_insert_attachment(['post_mime_type' => $mime, 'post_title' => $partner['name'], 'post_status' => 'inherit', 'post_author' => 1], $upload['file'], 0, true);
            if (is_wp_error($image_id)) { echo wp_json_encode(['error' => 'Partner attachment failed']); exit; }
            wp_update_attachment_metadata($image_id, wp_generate_attachment_metadata($image_id, $upload['file']));
        }
        $data = [
            'slug' => $partner['id'], 'kind' => $partner['kind'] ?? 'organization',
            'name' => $partner['name'], 'description' => $partner['description'],
            'website' => $partner['website'] ?? '', 'order' => $partner['order'],
            'imageId' => $image_id, 'imageAlt' => $partner['logo']['alt'] ?? ['uk' => '', 'de' => ''],
            'imageFocus' => 50, 'publicationPermission' => false,
        ];
        $request = new WP_REST_Request('POST', '/sonnenblume/v1/partners');
        $request->set_header('Content-Type', 'application/json');
        $request->set_body(wp_json_encode(['action' => 'publish', 'data' => $data]));
        $result = rest_do_request($request);
        if ($result->get_status() !== 201) { echo wp_json_encode(['error' => $result->get_data()]); exit; }
    }
    update_option('snb_partners_seeded', true, false);
    update_option('snb_partners_initialized', true, false);
}
// Local-only short-lived native WordPress login. This helper is not part of the plugin.
$key = bin2hex(random_bytes(32));
set_transient('snb_local_preview_key', hash('sha256', $key), 3600);
if (!is_dir(WPMU_PLUGIN_DIR)) wp_mkdir_p(WPMU_PLUGIN_DIR);
file_put_contents(WPMU_PLUGIN_DIR . '/snb-local-preview.php', '<?php add_filter("automatic_updater_disabled", "__return_true"); add_filter("auto_update_plugin", "__return_false"); add_action("init", function () { if (!isset($_GET["snb_local_preview"])) return; $key = get_transient("snb_local_preview_key"); if (!$key || !is_string($_GET["snb_local_preview"]) || !hash_equals($key, hash("sha256", $_GET["snb_local_preview"]))) { status_header(403); exit; } delete_transient("snb_local_preview_key"); wp_set_auth_cookie(1); wp_safe_redirect(admin_url("admin.php?page=sonnenblume-content")); exit; });');
echo wp_json_encode(['login' => 'http://127.0.0.1:9400/?snb_local_preview=' . $key]);
`,
});
if (response.exitCode !== 0)
  throw new Error(response.errors || "WordPress seed failed");
const result = JSON.parse(response.text);
if (!result.login) throw new Error(JSON.stringify(result));
console.log(
  "Local WordPress editor ready (loopback only). Database persists between restarts.",
);
console.log(`Local preview: ${result.login}`);
console.log(
  "This one-use link expires in 1 hour. Production uses normal WordPress accounts.",
);
const shutdown = async () => {
  await runtime[Symbol.asyncDispose]();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
