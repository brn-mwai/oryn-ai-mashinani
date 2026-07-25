import type React from "react"
import "../basehub.config"
import "../styles/globals.css"
import { Geist, Geist_Mono, Space_Mono } from "next/font/google"
import { basehub } from "@/lib/basehub-stubs"
import { Toolbar } from "@/lib/basehub-stubs/next-toolbar"
import { Providers } from "./providers"
import { footerFragment, headerFragment } from "../lib/basehub/fragments"
import { themeFragment } from "../context/basehub-theme-provider"
import { PlaygroundSetupModal } from "../components/playground-notification"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CookieConsent } from "@/components/cookie-consent"
import { orynContent } from "../lib/oryn-content"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  fallback: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Oxygen",
    "Ubuntu",
    "Cantarell",
    "Fira Sans",
    "Droid Sans",
    "Helvetica Neue",
    "sans-serif",
  ],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  fallback: ["monaco", "monospace"],
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-typewriter",
})

export const dynamic = "force-static"
export const revalidate = 30

const envs: Record<string, { isValid: boolean; name: string; label: string }> = {}
const _vercel_url_env_name = "VERCEL_URL"
const isMainV0 = process.env[_vercel_url_env_name]?.startsWith("preview-marketing-website-kzmm0bsl7yb9no8k62xm")

let allValid = true
const subscribeEnv = ({
  name,
  label,
  value,
}: {
  name: string
  label: string
  value: string | undefined
}) => {
  const isValid = !!value
  if (!isValid) {
    allValid = false
  }
  envs[name] = {
    isValid,
    name,
    label,
  }
}

// Oryn logo configuration
const fallbackLogo = {
  light: {
    url: "/logo-dark.svg",
    alt: "Oryn",
    width: 410,
    height: 133,
    aspectRatio: "410/133",
    blurDataURL: null,
  },
  dark: {
    url: "/logo-light.svg",
    alt: "Oryn",
    width: 410,
    height: 133,
    aspectRatio: "410/133",
    blurDataURL: null,
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let siteData;
  try {
    siteData = await basehub().query({
      site: {
        settings: {
          theme: themeFragment,
          logo: {
            dark: {
              url: true,
              alt: true,
              width: true,
              height: true,
              aspectRatio: true,
              blurDataURL: true,
            },
            light: {
              url: true,
              alt: true,
              width: true,
              height: true,
              aspectRatio: true,
              blurDataURL: true,
            },
          },
          showUseTemplate: true,
        },
        header: headerFragment,
        footer: footerFragment,
      },
    });
  } catch {
    // BaseHub not configured, use Oryn defaults
    siteData = {
      site: {
        settings: { theme: null, logo: fallbackLogo, showUseTemplate: false },
        header: {
          navbar: {
            items: orynContent.header.navbar.items.map((item) => ({
              _id: item._id,
              _title: item._title,
              href: item.href,
              sublinks: { items: [] },
            })),
          },
          rightCtas: {
            items: orynContent.header.ctas,
          },
        },
        footer: {
          navbar: {
            items: orynContent.footer.navbar.items.map((item) => ({
              _id: item._id,
              _title: item._title,
              href: item.href,
              children: { items: [] },
            })),
          },
          copyright: orynContent.footer.copyright,
          socialLinks: orynContent.footer.socialLinks.map((link) => ({
            _id: link._id,
            _title: link._title,
            icon: link._title.toLowerCase(),
            url: link.href,
          })),
          newsletter: null,
        },
      },
    };
  }

  const { site: { footer, settings, header } } = siteData;

  // Always use the Oryn branding instead of BaseHub
  settings.logo = fallbackLogo;
  footer.copyright = orynContent.footer.copyright;

  // Override footer navbar - only Privacy Policy and Terms
  footer.navbar = {
    items: [
      { _id: "nav-privacy", _title: "Privacy Policy", url: "/privacy", children: { items: [] } },
      { _id: "nav-terms", _title: "Terms", url: "/terms", children: { items: [] } },
    ],
  };

  // Override header navbar with Oryn section links
  header.navbar = {
    items: orynContent.header.navbar.items.map((item) => ({
      _id: item._id,
      _title: item._title,
      href: item.href,
      sublinks: { items: [] },
    })),
  };

  // Override header CTAs with Oryn CTAs
  header.rightCtas = {
    items: orynContent.header.ctas,
  };

  let playgroundNotification = null

  subscribeEnv({
    name: "BASEHUB_TOKEN",
    label: "BaseHub Read Token",
    value: process.env.BASEHUB_TOKEN,
  })

  if (!isMainV0 && !allValid && process.env.NODE_ENV !== "production") {
    const playgroundData = await basehub().query({
      _sys: {
        playgroundInfo: {
          expiresAt: true,
          editUrl: true,
          claimUrl: true,
        },
      },
    })

    if (playgroundData._sys.playgroundInfo) {
      playgroundNotification = <PlaygroundSetupModal playgroundInfo={playgroundData._sys.playgroundInfo} envs={envs} />
    }
  }

  return (
    <html suppressHydrationWarning lang="en">
      <body
        className={`min-h-svh max-w-[100vw] bg-[--surface-primary] text-[--text-primary] dark:bg-[#1A2B32] dark:text-[--dark-text-primary] ${geistMono.variable} ${geist.variable} ${spaceMono.variable} font-sans`}
      >
        <Providers theme={settings.theme}>
          {!isMainV0 && <Toolbar />}
          {playgroundNotification}
          {/* Vertical Lines - hidden on mobile, visible on md+ */}
          <div className="pointer-events-none fixed inset-0 z-0 hidden h-full w-full md:grid md:grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)]">
            <div className="col-span-1" />
            <div className="col-span-1 border-x border-[--border] dark:border-[#3a4f58]" />
            <div className="col-span-1" />
          </div>
          {/* Header */}
          <Header logo={settings.logo} header={header} />
          <main className="relative z-10 min-h-[calc(100svh-var(--header-height))]">{children}</main>
          {/* Footer */}
          <Footer footer={footer} logo={settings.logo} />
          {/* Purple Marquee */}
          <div className="w-full md:grid md:grid-cols-[clamp(28px,10vw,120px)_auto_clamp(28px,10vw,120px)]">
            <div className="hidden md:block" />
            <div className="bg-[#D2B4FA] overflow-hidden py-3 md:border-x md:border-[#c9a5f7]">
              <div className="animate-marquee flex whitespace-nowrap items-center">
                {[
                  "GET PAID FASTER",
                  "AI-POWERED COLLECTION",
                  "PAID WITHOUT THE AWKWARD CHASE",
                  "AUTONOMOUS PAYMENT RECOVERY",
                  "5% SUCCESS FEE",
                  "NO UPFRONT COSTS",
                  "96% COLLECTION RATE",
                  "MULTI-CHANNEL OUTREACH",
                  "SMART ESCALATION",
                  "GET PAID FASTER",
                  "AI-POWERED COLLECTION",
                  "PAID WITHOUT THE AWKWARD CHASE",
                  "AUTONOMOUS PAYMENT RECOVERY",
                  "5% SUCCESS FEE",
                  "NO UPFRONT COSTS",
                  "96% COLLECTION RATE",
                  "MULTI-CHANNEL OUTREACH",
                  "SMART ESCALATION",
                ].map((message, index) => (
                  <span
                    key={index}
                    className="mx-4 font-['FK_Raster_Grotesk'] text-xs font-medium tracking-wide text-[#1A2B32]"
                  >
                    {message}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden md:block" />
          </div>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  )
}

export const metadata = {
  title: "Oryn - AI Collection Agent",
  description: "The world's first AI Collection Agent. You're owed money. Oryn collects it.",
  generator: "Oryn",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
}
