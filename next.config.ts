import type { NextConfig } from "next";

const isGitHubPagesExport = process.env.GITHUB_PAGES_EXPORT === "true";

const nextConfig: NextConfig = {
  output: isGitHubPagesExport ? "export" : undefined,
  trailingSlash: isGitHubPagesExport,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 82],
    unoptimized: isGitHubPagesExport,
  },
  ...(isGitHubPagesExport
    ? {}
    : {
        // Next 16's normalized middleware URL may use localhost while the router
        // init URL uses the bound host. That turns a localized internal rewrite
        // into a self-proxy/redirect loop in production. Preserve the init URL.
        skipProxyUrlNormalize: true,
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                {
                  key: "Referrer-Policy",
                  value: "strict-origin-when-cross-origin",
                },
                {
                  key: "Permissions-Policy",
                  value:
                    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
                },
              ],
            },
          ];
        },
      }),
};

export default nextConfig;
