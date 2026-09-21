import type { Metadata, Viewport } from "next"
import { Inter, Montserrat } from "next/font/google"
import { site } from "@/lib/site"
import { BackgroundLayer } from "@/components/background"
import { Header } from "@/components/header"
import { ConditionalFooter } from "@/components/conditional-footer"
import { SettingsProvider } from "@/components/settings-provider"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
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
}

export const viewport: Viewport = {
  themeColor: "#95FF50",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="default" data-theme-id="default" suppressHydrationWarning>
      <body className={`${inter.variable} ${montserrat.variable} font-sans antialiased`}>
        <BackgroundLayer />
        <div className="app-shell flex min-h-screen flex-col">
          <SettingsProvider />
          <Header />
          <div className="relative z-10 flex-1">{children}</div>
          <ConditionalFooter />
        </div>
      </body>
    </html>
  )
}