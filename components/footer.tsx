import Link from "next/link"
import { Wordmark } from "@/components/brand"
import { site } from "@/lib/site"

export function Footer() {
  return (
    <footer className="w-full relative z-20 py-8 px-6 lg:px-16 mt-auto pb-28 lg:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-5">
            <Link href="/" aria-label="Home" className="group relative flex items-center justify-center">
              <div className="relative z-10 transition-transform duration-300 group-hover:scale-110">
                <Wordmark className="logo-legible select-none text-white h-9 w-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
              </div>
            </Link>
            <div className="w-px h-8 bg-white/10" />
            <a href="https://discord.gg/" target="_blank" rel="noopener noreferrer" aria-label="Discord" className="group block transition-transform duration-300 hover:scale-110">
              <DiscordMark className="w-7 h-7" />
            </a>
          </div>
          <p className="text-white/40 text-xs leading-relaxed text-center max-w-lg">
            {site.name} does not host, store, or distribute any media files. All content is sourced from third-party providers.
          </p>
          <a
            href={`mailto:contact@${site.url.replace("https://", "")}`}
            className="text-white/30 text-xs hover:text-white/60 transition-colors duration-200 underline underline-offset-2"
          >
            contact@{site.url.replace("https://", "")}
          </a>
        </div>
      </div>
    </footer>
  )
}

function DiscordMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="discord-gradient-footer" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#a1a1aa" />
        </linearGradient>
      </defs>
      <path
        d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 0 0-.0785-.037 19.7363 19.7363 0 0 0-4.8852 1.515.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z"
        fill="url(#discord-gradient-footer)"
      />
    </svg>
  )
}