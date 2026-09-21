"use client"

import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f0f0f] text-white px-6">
      <p className="text-7xl font-bold mb-2">404</p>
      <p className="text-white/50 text-sm mb-8 max-w-md text-center">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="h-10 px-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold transition-colors inline-flex items-center"
      >
        Go home
      </Link>
    </div>
  )
}
