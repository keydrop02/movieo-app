import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://image.tmdb.org https://*.tmdb.org https://i.ytimg.com https://*.ytimg.com data: blob:",
      "media-src 'self' https://*.cinesrc.st https://*.vidfast.pro https://*.vidlove.cc https://*.xpass.top https://*.vidup.to https://*.youtube.com https://*.googlevideo.com",
      "frame-src https://www.youtube.com https://*.cinesrc.st https://*.vidfast.pro https://*.vidlove.cc https://*.xpass.top https://*.vidup.to",
      "connect-src 'self' https://api.themoviedb.org https://*.cinesrc.st https://*.vidfast.pro https://*.vidlove.cc https://*.xpass.top https://*.vidup.to https://www.youtube.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  images: {
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
