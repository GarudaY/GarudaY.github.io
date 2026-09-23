#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const source = process.argv[2];
const outputDirectory = process.argv[3];
const databaseName = process.env.SNB_STAGE_DB_NAME;
const databaseUser = process.env.SNB_STAGE_DB_USER ?? databaseName;
const databasePassword = process.env.SNB_STAGE_DB_PASSWORD;
const stagingUrl = process.env.SNB_STAGE_URL ?? "https://staging.sonnenblume-mg.com";

if (!source || !outputDirectory) {
  throw new Error("Usage: prepare-wordpress-staging.mjs <source wp-config.php> <output directory>");
}
if (!databaseName || !databaseUser || !databasePassword) {
  throw new Error("SNB_STAGE_DB_NAME, SNB_STAGE_DB_USER, and SNB_STAGE_DB_PASSWORD are required");
}
if (!/^https:\/\/[a-z0-9.-]+$/i.test(stagingUrl)) {
  throw new Error("SNB_STAGE_URL must be an HTTPS origin without a path");
}

const phpString = (value) => `'${value.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}'`;
const definePattern = (name) =>
  new RegExp(`define\\s*\\(\\s*(['"])${name}\\1\\s*,[\\s\\S]*?\\)\\s*;`, "g");

let config = fs.readFileSync(source, "utf8");
const required = new Map([
  ["DB_NAME", phpString(databaseName)],
  ["DB_USER", phpString(databaseUser)],
  ["DB_PASSWORD", phpString(databasePassword)],
  ["DB_HOST", phpString("localhost")],
]);
for (const [name, value] of required) {
  const pattern = definePattern(name);
  const matches = [...config.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${name} definition, found ${matches.length}`);
  }
  config = config.replace(pattern, `define( '${name}', ${value} );`);
}

const stagingDefines = new Map([
  ["WP_HOME", phpString(stagingUrl)],
  ["WP_SITEURL", phpString(stagingUrl)],
  ["WP_ENVIRONMENT_TYPE", phpString("staging")],
  ["DISABLE_WP_CRON", "true"],
  ["DISALLOW_FILE_EDIT", "true"],
  ["WP_DEBUG", "false"],
  ["WP_DEBUG_DISPLAY", "false"],
]);
for (const name of stagingDefines.keys()) {
  config = config.replace(definePattern(name), "");
}

const markerPattern = /\/\*\s*That's all, stop editing![\s\S]*?\*\//i;
const marker = config.match(markerPattern)?.[0];
if (!marker) {
  throw new Error("Could not find the WordPress stop-editing marker");
}
const block = [
  "/* SONNENBLUME staging isolation. */",
  ...[...stagingDefines].map(([name, value]) => `define( '${name}', ${value} );`),
  "",
].join("\n");
config = config.replace(markerPattern, `${block}${marker}`);

const outputRoot = path.resolve(outputDirectory);
const muPluginDirectory = path.join(outputRoot, "wp-content", "mu-plugins");
fs.mkdirSync(muPluginDirectory, { recursive: true });
fs.writeFileSync(path.join(outputRoot, "wp-config.php"), config, { encoding: "utf8", flag: "wx" });
fs.writeFileSync(
  path.join(muPluginDirectory, "sonnenblume-staging-safety.php"),
  `<?php
/**
 * Plugin Name: SONNENBLUME staging safety
 * Description: Prevents outgoing email and indexing on the private staging copy.
 */

if (!defined('ABSPATH')) {
    exit;
}

add_filter('pre_wp_mail', static function () {
    return false;
}, PHP_INT_MAX);

add_filter('wp_headers', static function (array $headers): array {
    $headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive';
    return $headers;
});

add_filter('robots_txt', static function (): string {
    return "User-agent: *\\nDisallow: /\\n";
}, PHP_INT_MAX);

add_action('admin_notices', static function (): void {
    echo '<div class="notice notice-warning"><p><strong>SONNENBLUME staging:</strong> outgoing email and scheduled tasks are disabled.</p></div>';
});
`,
  { encoding: "utf8", flag: "wx" },
);
fs.writeFileSync(
  path.join(outputRoot, "robots.txt"),
  "User-agent: *\nDisallow: /\n",
  { encoding: "utf8", flag: "wx" },
);

process.stdout.write(`Prepared isolated staging overlay in ${outputRoot}\n`);
