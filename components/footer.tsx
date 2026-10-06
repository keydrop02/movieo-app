import Link from "next/link"
import { site } from "@/lib/site"

export function Footer() {
  return (
    <footer className="w-full relative z-20 py-8 px-6 lg:px-16 mt-auto pb-28 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-4">
          <p className="text-white/40 text-xs leading-relaxed text-center max-w-lg">
            {site.name} does not host, store, or distribute any media files. All content is sourced from third-party
            providers.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
              { href: "/dmca", label: "DMCA" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-white/40 text-xs underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
