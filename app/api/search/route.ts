import { NextRequest, NextResponse } from "next/server"
import { searchAll } from "@/lib/tmdb/client"

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim()
  if (!q) return NextResponse.json({ items: [] })
  const items = await searchAll(q)
  return NextResponse.json({ items })
}