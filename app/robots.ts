import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Sample site: keep it out of search until the client approves launch.
  return { rules: [{ userAgent: "*", disallow: "/" }] };
}
