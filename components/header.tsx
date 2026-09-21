"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bookmark, Clapperboard, House, Search, Tv, User } from "lucide-react"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { SettingsMenu } from "@/components/settings-menu"
import { cx } from "@/lib/utils"

const DESKTOP_LINKS: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/series", label: "TV Shows" },
  { href: "/lists", label: "My List" },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const navRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const searchBtnRef = useRef<HTMLButtonElement>(null)
  const settingsBtnRef = useRef<HTMLButtonElement | null>(null)
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const measure = useCallback(() => {
    const nav = navRef.current
    if (!nav) return
    const tab = navTabIndex(pathname)
    let el: HTMLElement | null = null
    if (tab !== null) el = itemRefs.current[tab] ?? null
    else if (pathname === "/search") el = searchBtnRef.current ?? null
    if (!el) {
      setPill(null)
      return
    }
    setPill({
      x: Math.round(el.getBoundingClientRect().left - nav.getBoundingClientRect().left) + (tab === 0 ? 6 : 0),
      w: el.offsetWidth,
    })
  }, [pathname])

  useLayoutEffect(() => {
    const tick = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(tick)
  }, [measure])

  useEffect(() => {
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [measure])

  const searchActive = pathname === "/search"

  if (pathname === "/shorts") return null

  return (
    <header className="pointer-events-none header-row flex fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-4 justify-between items-center lg:py-6">
      <nav
        ref={navRef}
        role="tablist"
        className="hidden lg:flex relative glass-dropdown desktop-nav items-center rounded-full pointer-events-auto gap-1 mx-auto"
      >
        {pill && (
          <div
            aria-hidden
            className="absolute left-0 rounded-full theme-pill-bg pointer-events-none z-0 will-change-transform pill-glow nav-pill pill-transition"
            style={{
              width: pill.w,
              transform: `translate3d(${pill.x}px, 0px, 0px) scale3d(1, 1, 1)`,
            }}
          />
        )}
        {DESKTOP_LINKS.map((l, i) => {
          const itemActive = isNavActive(pathname, l.href)
          return (
            <Link
              key={l.href}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              href={l.href}
              className={cx(
                "relative z-10 flex items-center justify-center gap-2 px-6 rounded-full text-sm font-medium nav-item whitespace-nowrap",
                itemActive ? "text-black theme-icon-active" : "text-white/60 hover:text-white",
              )}
            >
              <span className="flex">
                {itemActive &&
                  (l.href === "/" ? (
                    <House className="w-[18px] h-[18px]" />
                  ) : l.href === "/movies" ? (
                    <Clapperboard className="w-[18px] h-[18px]" />
                  ) : l.href === "/series" ? (
                    <Tv className="w-[18px] h-[18px]" />
                  ) : (
                    <Bookmark className="w-[18px] h-[18px]" />
                  ))}
              </span>
              {l.label}
            </Link>
          )
        })}
        <span aria-hidden className="nav-divider" />
        <button
          ref={searchBtnRef}
          aria-label="Search"
          onClick={() => router.push("/search")}
          className={cx(
            "relative z-10 flex items-center justify-center rounded-full nav-item is-icon",
            searchActive ? "text-black theme-icon-active" : "text-white/60 hover:text-white hover:bg-white/[0.08]",
          )}
        >
          <Search className="w-[18px] h-[18px]" />
        </button>
        <SettingsTrigger ref={settingsBtnRef} onOpenChange={setMenuOpen} open={menuOpen} />
      </nav>

      <div className="lg:hidden pointer-events-auto">
        <MobileBar pathname={pathname} onOpenSettings={() => setMenuOpen((v) => !v)} onLongPress={() => setMenuOpen(false)} />
      </div>

      <SettingsMenu open={menuOpen} onClose={() => setMenuOpen(false)} anchorRef={settingsBtnRef} />
    </header>
  )
}

function SettingsTrigger({
  open,
  onOpenChange,
  ref,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  ref: React.RefObject<HTMLButtonElement | null>
}) {
  return (
    <div className="relative profile-container z-20">
      <button
        ref={ref}
aria-label="Profile"
        data-profile-trigger
        onClick={(e) => {
          e.stopPropagation()
          onOpenChange(!open)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="relative flex items-center justify-center rounded-full nav-item is-icon text-white/60 hover:text-white hover:bg-white/[0.08]"
      >
        <User className="w-[18px] h-[18px]" />
      </button>
    </div>
  )
}

function MobileBar({
  pathname,
  onOpenSettings,
  onLongPress,
}: {
  pathname: string
  onOpenSettings: () => void
  onLongPress: () => void
}) {
  const longPressTimer = useRef<number | null>(null)
  const suppressTap = useRef(false)

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }
  const items = [
    { href: "/", label: "Home", Icon: House },
    { href: "/movies", label: "Movies", Icon: Clapperboard },
    { href: "/series", label: "TV Shows", Icon: Tv },
    { href: "/lists", label: "My List", Icon: Bookmark },
  ]
  const btn =
    "relative flex items-center justify-center w-[13vw] max-w-[56px] h-10 rounded-full transition-colors duration-300"
  const searchActive = pathname === "/search"
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center h-16 px-3.5 rounded-full shadow-2xl glass-dropdown mobile-nav-bar gap-1">
      {items.map(({ href, label, Icon }) => {
        const active = isNavActive(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            className={cx(
              btn,
              active ? "theme-glass-tint-active text-white" : "text-[#9ca3af] hover:text-white",
            )}
          >
            <Icon className="w-6 h-6" />
          </Link>
        )
      })}
      <Link
        href="/search"
        aria-label="Search"
        className={cx(btn, searchActive ? "theme-glass-tint-active text-white" : "text-[#9ca3af] hover:text-white")}
      >
        <Search className="w-6 h-6" />
      </Link>
      <button
        aria-label="Settings"
        data-profile-trigger
        onPointerDown={(e) => {
          suppressTap.current = false
          clearLongPress()
          if (e.pointerType === "mouse") return
          longPressTimer.current = window.setTimeout(() => {
            suppressTap.current = true
            clearLongPress()
            onLongPress()
          }, 500)
        }}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
        onContextMenu={(e) => {
          e.preventDefault()
          clearLongPress()
          onLongPress()
        }}
        onClick={() => {
          clearLongPress()
          if (suppressTap.current) {
            suppressTap.current = false
            return
          }
          onOpenSettings()
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx(btn, "text-[#9ca3af] hover:text-white")}
      >
        <User className="w-6 h-6" />
      </button>
    </div>
  )
}

function navTabIndex(pathname: string): number | null {
  if (pathname === "/") return 0
  if (
    pathname === "/movies" ||
    pathname.startsWith("/movie/") ||
    pathname.startsWith("/watch/movie/") ||
    pathname.startsWith("/category/movie/")
  )
    return 1
  if (
    pathname === "/series" ||
    pathname.startsWith("/series/") ||
    pathname.startsWith("/watch/tv/") ||
    pathname.startsWith("/category/tv/") ||
    pathname.startsWith("/category/series/")
  )
    return 2
  if (pathname === "/lists" || pathname.startsWith("/lists/")) return 3
  return null
}

export function isNavActive(pathname: string, href: string): boolean {
  const tab = navTabIndex(pathname)
  if (tab === null) return false
  return DESKTOP_LINKS[tab]?.href === href
}