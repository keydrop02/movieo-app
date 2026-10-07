import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { site } from "@/lib/site"
import { BackgroundLayer } from "@/components/background"
import { Header } from "@/components/header"
import { ConditionalFooter } from "@/components/conditional-footer"
import { SettingsProvider } from "@/components/settings-provider"
import { ScrollTopButton } from "@/components/scroll-top-button"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.tagline} - ${site.name}`,
    template: `%s - ${site.name}`,
  },
  description: site.description,
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/movieo-logo.png", sizes: "1254x1254", type: "image/png" }],
    // iOS does not read the manifest; without this link a home-screen install
    // falls back to a screenshot of the page.
    apple: [{ url: "/movieo-logo.png", sizes: "1254x1254", type: "image/png" }],
  },
  applicationName: site.name,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.tagline} - ${site.name}`,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.tagline} - ${site.name}`,
    description: site.description,
  },
}

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <BackgroundLayer />
        {/* Keyboard users otherwise have to tab through the whole header on
            every page. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-black"
        >
          Skip to content
        </a>
        <div className="app-shell flex min-h-screen flex-col">
          <SettingsProvider />
          <Header />
          <main id="main" tabIndex={-1} className="relative z-10 flex-1 focus:outline-none">
            {children}
          </main>
          <ConditionalFooter />
          <ScrollTopButton />
        </div>
      </body>
    </html>
  )
}