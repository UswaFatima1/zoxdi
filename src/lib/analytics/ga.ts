/**
 * Google Analytics (GA4) helpers.
 *
 * Everything here is inert unless `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set at
 * build time, so a self-hosted copy of Zoxdi stays completely tracker-free by
 * default. When a measurement ID is present, `gtag.js` is loaded by the
 * `<GoogleAnalytics />` component and these helpers forward page views and
 * engagement events to it.
 */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/** True when a GA4 measurement ID was provided for this build. */
export const GA_ENABLED = GA_MEASUREMENT_ID.length > 0;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Send a named engagement event (login, sign_up, form_submit, ...). */
export function trackEvent(name: string, params: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, params);
}

/** Send an explicit page_view for client-side navigations. */
export function trackPageView(pagePath: string): void {
  if (!GA_ENABLED) return;
  trackEvent("page_view", { page_path: pagePath });
}
