"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export function BackButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className="flex items-center gap-2 h-10 px-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white/90 text-sm font-medium transition-all cursor-pointer"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  )
}