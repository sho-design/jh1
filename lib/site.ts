/**
 * Public origin of the site, for metadata, the sitemap and Stripe redirects.
 * An empty or scheme-less NEXT_PUBLIC_SITE_URL (easy to paste into Vercel)
 * falls through instead of crashing the build. VERCEL_PROJECT_PRODUCTION_URL
 * is set by Vercel on every deployment.
 */
export function siteUrl(fallback = "http://localhost:3000"): string {
  for (const raw of [process.env.NEXT_PUBLIC_SITE_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
    const value = raw?.trim();
    if (!value) continue;
    try {
      return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).origin;
    } catch { /* not a URL: try the next source */ }
  }
  return fallback;
}
