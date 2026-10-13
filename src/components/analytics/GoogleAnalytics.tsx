"use client";

import { Suspense, useEffect } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_ENABLED, GA_MEASUREMENT_ID, trackPageView } from "@/lib/analytics/ga";

/**
 * Records a page_view on every client-side route change. GA4 is configured
 * with `send_page_view: false` so the React router is the only source of truth.
 * `useSearchParams` needs a Suspense boundary during static export.
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams?.toString();
    trackPageView(query ? `${pathname}?${query}` : pathname ?? "/");
  }, [pathname, searchParams]);

  return null;
}

/** Loads gtag.js and bootstraps GA4. Renders nothing when unconfigured. */
export function GoogleAnalytics() {
  if (!GA_ENABLED) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });`}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
