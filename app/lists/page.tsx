import type { Metadata } from "next"
import { ListsPage } from "@/components/lists-page"

export const metadata: Metadata = {
  title: "Lists",
  description: "Create and organize your own movie and TV show lists.",
  alternates: { canonical: "/lists" },
}

export default function Page() {
  return <ListsPage />
}