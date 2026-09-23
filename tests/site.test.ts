import { afterEach, describe, expect, it, vi } from "vitest";
import { siteUrl } from "@/lib/site";

describe("siteUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("ignores an empty NEXT_PUBLIC_SITE_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(siteUrl("https://fallback.test")).toBe("https://fallback.test");
  });

  it("adds https to a bare host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "jh1parts.ca/");
    expect(siteUrl()).toBe("https://jh1parts.ca");
  });

  it("uses the Vercel production host when the site URL is unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", " ");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "jh1-team.vercel.app");
    expect(siteUrl()).toBe("https://jh1-team.vercel.app");
  });
});
