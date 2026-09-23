/**
 * Two visual directions under review. The whole site switches between them
 * with html[data-look]; pick one, then delete the other and this switcher.
 *
 * The hero gearbox is rendered live (lib/gearbox.ts). The stills here were
 * generated with Higgsfield and are only a no-WebGL fallback, served from its
 * CDN for the review build. Move the chosen file into public/ before launch.
 */
export type LookId = "a" | "b";

const CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_2vgr4LDcTnBdquYG4fMZ396AWcW";

export interface Look {
  id: LookId;
  name: string;
  line: string;
  /** assembled still, generated reference for the 3D model */
  poster: string;
  /** exploded still, shown when WebGL is unavailable */
  still: string;
}

export const LOOKS: Record<LookId, Look> = {
  a: {
    id: "a",
    name: "Build Plate",
    line: "Light, warm, editorial",
    poster: `${CDN}/hf_20260923_232046_4f812718-84d3-4efb-b42e-6d0cef305613_min.webp`,
    still: `${CDN}/hf_20260923_232151_9ea3b867-07b2-4c24-8089-157a2a4464b1_min.webp`,
  },
  b: {
    id: "b",
    name: "Blueprint",
    line: "Dark, technical, precise",
    poster: `${CDN}/hf_20260923_232046_e0704bac-3b77-4b6e-b1d5-526d3a89d996_min.webp`,
    still: `${CDN}/hf_20260923_232150_7b662b0a-bd63-4136-82e9-8902ad9597f5_min.webp`,
  },
};

export const DEFAULT_LOOK: LookId = "a";

/** Runs in <head> before paint: ?look= wins, then the last choice, then the default. */
export const LOOK_BOOT = `(function(){try{var q=new URLSearchParams(location.search).get("look");var s=q==="a"||q==="b"?q:localStorage.getItem("jh1-look");if(q==="a"||q==="b")localStorage.setItem("jh1-look",q);document.documentElement.dataset.look=s==="b"?"b":"${DEFAULT_LOOK}";}catch(e){document.documentElement.dataset.look="${DEFAULT_LOOK}";}})();`;
