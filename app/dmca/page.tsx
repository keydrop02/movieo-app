import type { Metadata } from "next"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "DMCA",
  description: `How to submit a copyright takedown notice to ${site.name}.`,
  alternates: { canonical: "/dmca" },
}

export default function DmcaPage() {
  return (
    <div className="relative z-10 pt-28 pb-24 px-6 lg:px-16">
      <article className="mx-auto max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-lg">DMCA &amp; Copyright</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-white/65">
          <section>
            <h2 className="text-base font-semibold text-white/90">No media is hosted here</h2>
            <p>
              {site.name} does not host, store, upload, or distribute any media files. We retrieve publicly available
              metadata from third-party APIs and link out to independent playback and download providers. We have no
              control over and no relationship with those providers&apos; catalogues.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white/90">Submitting a notice</h2>
            <p>
              If you believe material reachable through this site infringes your copyright, send a notice to{" "}
              <a href={`mailto:${site.contactEmail}`} className="text-white underline underline-offset-4">
                {site.contactEmail}
              </a>{" "}
              including all of the following:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Your physical or electronic signature.</li>
              <li>Identification of the copyrighted work claimed to be infringed.</li>
              <li>The specific URL on this site where the material appears.</li>
              <li>Your name, address, telephone number, and email address.</li>
              <li>
                A statement that you have a good-faith belief the use is not authorised by the copyright owner, its
                agent, or the law.
              </li>
              <li>
                A statement, under penalty of perjury, that the information in the notice is accurate and that you are
                the owner or authorised to act on the owner&apos;s behalf.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white/90">What happens next</h2>
            <p>
              We review complete notices and, where appropriate, remove the relevant link and record the resolution.
              Misrepresented notices carry legal liability for the sender under 17 U.S.C. § 512(f).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white/90">Counter-notices</h2>
            <p>
              If material was removed by mistake or misidentification, the owner may send a counter-notice to the same
              address with the elements required by 17 U.S.C. § 512(g)(3).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white/90">Repeat infringers</h2>
            <p>In accordance with the DMCA, we will block access for repeat infringers where appropriate.</p>
          </section>
        </div>
      </article>
    </div>
  )
}
