import type { MetadataRoute } from "next";
import { PROCESS_PAGES } from "@/lib/processes";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jh1.vercel.app";
  return [
    { url: `${base}/` },
    { url: `${base}/quote` },
    ...PROCESS_PAGES.map((p) => ({ url: `${base}/processes/${p.slug}` })),
  ];
}
