const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(
  /\/$/,
  "",
);

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return configuredApiBase
    ? `${configuredApiBase}${normalizedPath}`
    : normalizedPath;
}
