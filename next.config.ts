import type { NextConfig } from "next"

/**
 * Error reporting is off unless a DSN is configured, so the monitoring origins
 * are added to the policy only when they are actually reachable. Hardcoding them
 * unconditionally would widen the allowlist for the common deployment that never
 * loads the SDK, and leaving them out entirely would silently break reporting for
 * the deployment that does: the CSP would block the CDN script and every ingest
 * request, with no visible error other than missing reports.
 */
const sentryEnabled = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN)
const SENTRY_SCRIPT = "https://browser.sentry-cdn.com"
const SENTRY_INGEST = "https://*.ingest.sentry.io"

// Next's dev client (React Flight/debug callstacks) calls eval() and logs a
// console error when the CSP blocks it. Production builds never use eval, so
// 'unsafe-eval' is only granted while running `next dev`.
const isDev = process.env.NODE_ENV === "development"

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is dev-only (see above); 'unsafe-inline' is still
      // required by Next's bootstrap/hydration scripts.
      [
        "script-src 'self' 'unsafe-inline'",
        isDev && "'unsafe-eval'",
        "https://www.youtube.com https://s.ytimg.com https://*.ytimg.com",
        sentryEnabled && SENTRY_SCRIPT,
      ]
        .filter(Boolean)
        .join(" "),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://image.tmdb.org https://*.tmdb.org https://i.ytimg.com https://*.ytimg.com data: blob:",
      // Embed providers are loaded as iframes and as <img> sources only. They
      // are deliberately absent from connect-src: all first-party data fetching
      // goes through our own origin (/api/*), so a compromised embed cannot
      // direct the browser at a new destination.
      "media-src 'self' https://www.youtube.com https://*.googlevideo.com",
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com https://cinesrc.st https://vidfast.pro https://vidlove.cc https://xpass.top https://vidup.to https://*.cinesrc.st https://*.vidfast.pro https://*.vidlove.cc https://*.xpass.top https://*.vidup.to",
      [
        "connect-src 'self' https://www.youtube.com https://*.googlevideo.com",
        sentryEnabled && SENTRY_INGEST,
      ]
        .filter(Boolean)
        .join(" "),
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  images: {
    // Custom loader, see `lib/tmdb/image-loader.ts`. The default loader needs
    // `/_next/image`, which does not exist on the Workers runtime we deploy to.
    loader: "custom",
    loaderFile: "./lib/tmdb/image-loader.ts",
    // Next's default width lists go up to 3840, and the loader would have to
    // answer those with TMDB's `original` rendition (1.9 MB for a single
    // backdrop). Trimming the ladders to widths TMDB actually publishes keeps
    // `original` out of every srcset.
    imageSizes: [92, 154, 185, 300, 342, 500],
    deviceSizes: [780, 1280],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
