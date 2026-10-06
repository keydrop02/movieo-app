import type { Metadata } from "next"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms that govern your use of ${site.name}.`,
  alternates: { canonical: "/terms" },
}

const SECTIONS = [
  {
    heading: "Acceptance",
    body: `By accessing ${site.name} you agree to these terms. If you do not agree, do not use the site.`,
  },
  {
    heading: "What this service is",
    body: `${site.name} is a discovery interface. We index publicly available metadata from TMDB and hand playback off to third-party embed providers. We do not host, upload, store, or stream any media file.`,
  },
  {
    heading: "No warranty",
    body: "The site is provided as is, without warranty of any kind. Availability of any particular title, embed, or download link is not guaranteed and may change without notice. Third-party providers operate independently and are responsible for their own service.",
  },
  {
    heading: "Acceptable use",
    body: "Do not use the site to break the law, to infringe copyright, to attack or overload the service, to circumvent rate limits or access controls, or to redistribute scraped data in bulk.",
  },
  {
    heading: "Content and copyright",
    body: "Titles, artwork, and metadata belong to their respective owners. Links point to third-party sources. If you believe something here infringes your rights, see the DMCA page for the notice process.",
  },
  {
    heading: "Limitation of liability",
    body: "To the maximum extent permitted by law, we are not liable for any indirect or consequential loss arising from your use of the site or of any third-party provider reached through it.",
  },
  {
    heading: "Changes",
    body: "We may update these terms. Continued use after a change means you accept the revised terms.",
  },
  {
    heading: "Contact",
    body: `Questions about these terms can go to ${site.contactEmail}.`,
  },
]

export default function TermsPage() {
  return (
    <div className="relative z-10 pt-28 pb-24 px-6 lg:px-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">Terms of Use</h1>
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
