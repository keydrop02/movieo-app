import type { Metadata } from "next"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} handles data: what is stored in your browser, what leaves your device, and what is never collected.`,
  alternates: { canonical: "/privacy" },
}

const SECTIONS = [
  {
    heading: "Summary",
    body: `${site.name} has no accounts and no server-side database of users. There is nothing to sign up for, and we do not know who you are.`,
  },
  {
    heading: "What stays in your browser",
    body: "Your watch history, playback progress, watchlist, and interface preferences are stored in your browser's localStorage. They are never transmitted to us, they stay on the device you used, and clearing your browser data removes them permanently.",
  },
  {
    heading: "What leaves your device",
    body: "Requests for titles, artwork, search results, and video playback go to third-party services we do not control, including TMDB for catalogue data and images, and external embed providers for video. Those services receive the ordinary network information every web request carries, such as your IP address and user agent, and are subject to their own privacy policies.",
  },
  {
    heading: "Cookies and analytics",
    body: `${site.name} sets no advertising or analytics cookies and runs no third-party tracking scripts. If error reporting is configured for this deployment, a monitoring service receives diagnostic reports from failures: the error message, the page it happened on, and your browser and IP details. We use that only to fix broken pages. It is off when no reporting address is set.`,
  },
  {
    heading: "Server logs",
    body: "Our hosting provider keeps short-lived request logs for security and abuse prevention. These may include IP addresses and requested URLs. We do not use them to build a profile of you.",
  },
  {
    heading: "Children",
    body: `${site.name} is not directed at children under 13 and we do not knowingly collect personal information from them.`,
  },
  {
    heading: "Your choices",
    body: "Because your data never leaves your device, there is nothing for us to export or delete on request. To remove everything, clear site data for this domain in your browser settings.",
  },
  {
    heading: "Changes",
    body: "If this policy changes materially we will update this page. Continued use after a change means the revised policy applies.",
  },
  {
    heading: "Contact",
    body: `Questions about this policy can go to ${site.contactEmail}.`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="relative z-10 pt-28 pb-24 px-6 lg:px-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">Privacy Policy</h1>
        <p className="mt-2 text-sm text-white/50">Last updated {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

        <div className="mt-8 space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold text-white/90">{section.heading}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/65">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  )
}
