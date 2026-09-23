const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
  /\/$/,
  "",
);
const apiMode = process.env.NEXT_PUBLIC_API_MODE;

function wordpressPath(path: string) {
  if (path === "/api/contact") return "/wp-json/sonnenblume/v1/contact";
  if (path === "/api/registrations")
    return "/wp-json/sonnenblume/v1/registrations";
  if (path.startsWith("/api/registrations/"))
    return path.replace(
      "/api/registrations/",
      "/wp-json/sonnenblume/v1/registrations/",
    );
  if (path === "/api/content/wordpress-news")
    return "/wp-json/sonnenblume/v1/updates/public";
  return path;
}

export function apiUrl(path: string) {
  const inputPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedPath =
    apiMode === "wordpress" ? wordpressPath(inputPath) : inputPath;
  return configuredApiBase
    ? `${configuredApiBase}${normalizedPath}`
    : normalizedPath;
}
