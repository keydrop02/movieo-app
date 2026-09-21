"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] text-white px-6">
      <p className="text-6xl font-bold mb-4">Oops</p>
      <p className="text-white/50 text-sm mb-8 max-w-md text-center">
        Something went wrong. Please try again or go back to the homepage.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="h-10 px-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold transition-colors cursor-pointer"
        >
          Try again
        </button>
        <Link
          href="/"
          className="h-10 px-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold transition-colors inline-flex items-center"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
