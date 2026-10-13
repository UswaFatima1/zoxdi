import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { ProfileGate } from "@/components/layout/ProfileGate";
import { ProgressProvider } from "@/lib/storage/ProgressContext";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import "./globals.css";

/**
 * Cloudflare Web Analytics: cookieless visitor and pageview counts. The beacon
 * only loads when a token is configured, so the app stays tracker-free by
 * default and never needs a consent banner.
 */
const CF_ANALYTICS_TOKEN = process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN ?? "";

/**
 * A rounded, friendly face for a game. Self-hosted at build time, so the app
 * still runs with no network once it is built.
 */
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zoxdi — Learn the language of business",
  description:
    "An adaptive, game-based accounting platform for students everywhere. Run a business, see every transaction change the books, and discover why mistakes happen before you memorise the rules.",
  applicationName: "Zoxdi",
  category: "education",
  keywords: [
    "accounting",
    "bookkeeping",
    "journal entries",
    "debit credit",
    "accounting equation",
    "financial statements",
    "learn accounting",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={nunito.variable} suppressHydrationWarning>
      <body>
        {/* Apply the saved theme before paint so there is no light flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var k=localStorage.getItem('zoxdi.theme');var t=k;if(k!=='light'&&k!=='dark'){var p=JSON.parse(localStorage.getItem('zoxdi.progress')||'{}');t=(p&&p.settings&&p.settings.theme)||'dark';}document.documentElement.classList.toggle('dark',t!=='light');}catch(e){document.documentElement.classList.add('dark');}`,
          }}
        />
        <ProgressProvider>
          <ProfileGate>
            <div className="flex min-h-screen flex-col pb-[72px] lg:pb-0">
              <Header />
              <main className="w-full flex-1 px-4 pb-20 sm:px-6 lg:px-8">
                {children}
              </main>
              <Footer />
              <MobileNav />
            </div>
          </ProfileGate>
        </ProgressProvider>
        <GoogleAnalytics />
        {CF_ANALYTICS_TOKEN ? (
          <Script
            id="cf-web-analytics"
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({ token: CF_ANALYTICS_TOKEN })}
          />
        ) : null}
      </body>
    </html>
  );
}
