"use client";

import { useEffect, useRef, useState } from "react";
import { LOOKS } from "@/lib/looks";
import { useLook } from "./useLook";

/**
 * Scroll-driven exploded view. The hero is a tall section with a sticky stage;
 * scroll progress through it takes the gearbox apart and lights up the parts
 * list. Falls back to the exploded still without WebGL.
 */
export default function ExplodedGearbox() {
  const lookId = useLook();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = canvas?.closest<HTMLElement>(".hx");
    if (!canvas || !hero) return;
    let disposed = false;
    let cleanup = () => {};

    import("@/lib/gearbox").then(({ createGearbox, PART_ORDER }) => {
      if (disposed) return;
      let gb: ReturnType<typeof createGearbox>;
      try { gb = createGearbox(canvas, lookId); } catch { setFallback(true); return; }

      const items = Array.from(hero.querySelectorAll<HTMLElement>(".callouts li"));
      const now = hero.querySelector<HTMLElement>(".hx-now");
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      let p = 0, shown = 0, raf = 0, visible = true;
      const t0 = performance.now();

      const progress = () => {
        const r = hero.getBoundingClientRect();
        const span = r.height - innerHeight;
        return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      };
      const layout = () => {
        const { width, height } = canvas.getBoundingClientRect();
        const wide = width > 860;
        // Keep the model clear of the copy: right side on desktop, lower half on phones.
        gb.resize(width, height, wide ? 0.68 : 0.5, wide ? 0.46 : 0.66);
      };
      const frame = () => {
        raf = 0;
        const target = progress();
        p += (target - p) * 0.18;
        if (Math.abs(target - p) < 0.0005) p = target;
        gb.update(p, still ? 0 : (performance.now() - t0) / 1000);
        hero.style.setProperty("--p", p.toFixed(3));
        const step = Math.min(PART_ORDER.length, Math.floor((p + 0.06) / 0.16));
        if (step !== shown) {
          shown = step;
          items.forEach((li, i) => li.classList.toggle("on", i < step));
          items.forEach((li, i) => li.classList.toggle("now", i === step - 1));
          const li = items[step - 1];
          if (now) now.textContent = li ? [...li.children].map((c) => c.textContent).join("  ·  ").replace("  ·  ", "  ") : "";
        }
        if (visible && (!still || p !== target)) raf = requestAnimationFrame(frame);
      };
      const kick = () => { if (!raf && visible) raf = requestAnimationFrame(frame); };

      const ro = new ResizeObserver(() => { layout(); kick(); });
      ro.observe(canvas);
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); });
      io.observe(hero);
      addEventListener("scroll", kick, { passive: true });
      layout();
      kick();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        removeEventListener("scroll", kick);
        gb.dispose();
      };
    });

    return () => { disposed = true; cleanup(); };
  }, [lookId]);

  if (fallback) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="hx-canvas" src={LOOKS[lookId].still} alt="A 3D-printed gearbox shown as an exploded view of its parts" />;
  }
  return <canvas key={lookId} ref={canvasRef} className="hx-canvas" role="img" aria-label="A 3D-printed planetary gearbox that comes apart into its five parts as you scroll" />;
}
