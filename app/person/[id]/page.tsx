import { notFound } from "next/navigation"
import { BackButton } from "@/components/back-button"
import { Filmography } from "@/components/filmography"
import { PersonBio } from "@/components/person-bio"
import { PosterRow } from "@/components/rows"
import { getPerson } from "@/lib/tmdb/client"
import { img } from "@/lib/tmdb/images"

function age(birthday: string | null, deathday: string | null): string {
  if (!birthday) return ""
  const from = new Date(birthday)
  const to = deathday ? new Date(deathday) : new Date()
  let age = to.getFullYear() - from.getFullYear()
  const m = to.getMonth() - from.getMonth()
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) age--
  return `${age} years old`
}

function formatDate(d: string | null): string {
  if (!d) return ""
  return new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const person = await getPerson(Number(id))
  if (!person) notFound()

  const birthday = formatDate(person.birthday)
  const metaParts = [
    person.birthday && `${birthday} (${age(person.birthday, person.deathday)})`,
    person.known_for_department,
    person.place_of_birth,
  ]
  const meta = metaParts.filter(Boolean).join("  ·  ")

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden pb-24">
      <div className="relative z-10 pt-28 px-6 lg:px-16">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-8">
            <BackButton />
          </div>
          <div className="flex flex-col sm:flex-row gap-8 lg:gap-14">
            <div className="flex-none mx-auto sm:mx-0">
              <div className="w-40 h-56 lg:w-56 lg:h-72 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-xl shadow-black/40">
                {person.profile_path ? (
                  <img className="w-full h-full object-cover" src={img(person.profile_path, "w500") ?? undefined} alt={person.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white/30">
                    {person.name.slice(0, 1)}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 space-y-5 flex-1 pt-6 sm:pt-8">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white drop-shadow-lg">{person.name}</h1>
                {person.known_for_department && (
                  <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-white/70 uppercase tracking-wide">
                    {person.known_for_department}
                  </span>
                )}
              </div>

              {meta && <p className="text-sm lg:text-base text-white/55 font-medium">{meta}</p>}

              {person.biography && <PersonBio text={person.biography} />}
            </div>
          </div>
        </div>
      </div>

      {person.known.length > 0 && (
        <div className="mt-14">
          <div className="px-6 lg:px-16 mb-2">
            <h2 className="text-xl lg:text-2xl font-bold text-white/90 px-2">Known For</h2>
          </div>
          <PosterRow items={person.known} padClass="px-6 lg:px-16" />
        </div>
      )}

      {person.credits.length > 0 && (
        <div className="mt-14 px-6 lg:px-16">
          <div className="mx-auto max-w-[1600px]">
            <Filmography credits={person.credits} />
          </div>
        </div>
      )}
    </div>
  )
}