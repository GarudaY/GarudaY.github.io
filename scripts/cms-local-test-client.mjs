import assert from "node:assert/strict";

// Intentionally fixed to the isolated loopback install. Never use production credentials here.
export const cms = "http://127.0.0.1:9400";
export const frontend = "http://localhost:3000";
export const fetchLocal = (url, options = {}) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(45000) });
export async function localCmsClient(collection) {
  assert.ok(["updates", "people", "courses", "events", "volunteer", "partners"].includes(collection));
  const cookies = new Map();
  const collect = (response) => {
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0];
      const index = pair.indexOf("=");
      cookies.set(pair.slice(0, index), pair.slice(index + 1));
    }
  };
  const cookieHeader = () =>
    [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
  collect(await fetchLocal(`${cms}/wp-login.php`));
  const login = await fetchLocal(`${cms}/wp-login.php`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      log: "admin",
      pwd: "password",
      "wp-submit": "Log In",
      testcookie: "1",
    }),
    redirect: "manual",
  });
  collect(login);
  assert.equal(login.status, 302, "Isolated local WordPress login failed");
  const page =
    collection === "people"
      ? "sonnenblume-people"
      : collection === "courses"
        ? "sonnenblume-courses"
        : collection === "events"
          ? "sonnenblume-events"
          : collection === "volunteer"
          ? "sonnenblume-volunteer"
          : collection === "partners"
            ? "sonnenblume-partners"
        : "sonnenblume-content";
  const admin = await fetchLocal(`${cms}/wp-admin/admin.php?page=${page}`, {
    headers: { Cookie: cookieHeader() },
  });
  assert.equal(admin.status, 200);
  const html = await admin.text();
  const match = html.match(/window\.SNB_CONTENT\s*=\s*(\{[^\n]+\});/);
  assert.ok(match, "Native admin REST configuration missing");
  const config = JSON.parse(match[1]);
  return {
    async uploadImage(filename, bytes, mime = "image/png") {
      const response = await fetchLocal(`${cms}/?rest_route=/wp/v2/media`, {
        method: "POST",
        headers: {
          Cookie: cookieHeader(),
          "X-WP-Nonce": config.nonce,
          "Content-Type": mime,
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
        body: bytes,
      });
      const data = await response.json();
      assert.equal(response.status, 201, JSON.stringify(data));
      return data.id;
    },
    async api(path = "", body) {
      const response = await fetchLocal(
        `${cms}/?rest_route=/sonnenblume/v1/${collection}${path}`,
        {
          method: body ? "POST" : "GET",
          headers: {
            Cookie: cookieHeader(),
            "X-WP-Nonce": config.nonce,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        },
      );
      const nonce = response.headers.get("X-WP-Nonce");
      if (nonce) config.nonce = nonce;
      const data = await response.json();
      assert.ok(response.ok, JSON.stringify(data));
      return data;
    },
  };
}
export async function frontendPage(path, expected = 200) {
  const response = await fetchLocal(`${frontend}${path}`, {
    headers: { "cache-control": "no-cache" },
  });
  assert.equal(response.status, expected, `Unexpected HTTP status for ${path}`);
  return response.text();
}
