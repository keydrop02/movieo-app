import { WatchChrome } from "@/components/watch-chrome"

export default function WatchLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <WatchChrome />
      {children}
    </>
  )
}