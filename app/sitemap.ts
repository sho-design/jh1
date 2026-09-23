import type { MetadataRoute } from "next";
import { PROCESS_PAGES } from "@/lib/processes";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: `${base}/` },
    { url: `${base}/quote` },
    ...PROCESS_PAGES.map((p) => ({ url: `${base}/processes/${p.slug}` })),
  ];
}
