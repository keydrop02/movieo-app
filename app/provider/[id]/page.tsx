import { notFound } from "next/navigation"
import { img } from "@/lib/tmdb/images"
import { ProviderExplorer } from "@/components/provider-explorer"
import { discover, getProviderDetail, getProvidersList } from "@/lib/tmdb/client"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const provider = await getProviderDetail(Number(id))
  return { title: provider?.name ?? "Provider" }
}

export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const provider = await getProviderDetail(Number(id))
  if (!provider) notFound()

  const providers = await getProvidersList()
  const logo = providers.find((p) => p.id === Number(id)) ?? null
  const disc = await discover("movie", { provider: id })

  return (
    <div className="relative z-10 pt-24 pb-20 px-6 lg:px-16">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl overflow-hidden bg-white/5 ring-1 ring-white/10 shadow-lg shrink-0">
            {logo && (
              <img className="w-full h-full object-cover" src={img(logo.logo_path, "w154") ?? undefined} alt={provider.name} />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-lg">{provider.name}</h1>
        </div>
        <ProviderExplorer providerId={Number(id)} initialItems={disc.items} initialTotalPages={disc.totalPages} />
      </div>
    </div>
  )
}
