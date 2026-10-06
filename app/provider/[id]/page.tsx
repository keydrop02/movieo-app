import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { img } from "@/lib/tmdb/images"
import { ProviderExplorer } from "@/components/provider-explorer"
import { discover, getProviderDetail, getProvidersList } from "@/lib/tmdb/client"
import { safeLoad } from "@/lib/tmdb/safe"
import type { MediaItem } from "@/lib/tmdb/types"

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params
  const provider = await getProviderDetail(Number(id)).catch(() => null)
  if (!provider) return { title: "Provider" }
  return {
    title: provider.name,
    description: `Browse what is streaming on ${provider.name} on Movieo.`,
    alternates: { canonical: `/provider/${id}` },
  }
}

export default async function ProviderPage({ params }: Params) {
  const { id } = await params
  const provider = await getProviderDetail(Number(id)).catch(() => null)
  if (!provider) notFound()

  // The provider lookup is what decides whether the page exists. The list and
  // logo are decoration, and the grid can recover on the client, so a failure
  // in either degrades instead of failing the prerender.
  const providers = await safeLoad(getProvidersList, [])
  const logo = providers.find((p) => p.id === Number(id)) ?? null
  const disc = await safeLoad(() => discover("movie", { provider: id }), {
    items: [] as MediaItem[],
    page: 1,
    totalPages: 1,
  })

  return (
    <div className="relative z-10 pt-24 pb-20 px-6 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-lg shrink-0">
            {logo && (
              <Image
                fill
                sizes="(max-width: 1024px) 56px, 64px"
                className="object-cover"
                src={img(logo.logo_path, "w154") ?? ""}
                alt={provider.name}
              />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">{provider.name}</h1>
        </div>
        {disc.items.length > 0 ? (
          <ProviderExplorer providerId={Number(id)} initialItems={disc.items} initialTotalPages={disc.totalPages} />
        ) : (
          <p className="text-sm text-white/60">Nothing from {provider.name} is available right now.</p>
        )}
      </div>
    </div>
  )
}
