"use client";

import { useEffect, useRef, useState } from "react";
import { LOOKS } from "@/lib/looks";
import { useLook } from "./useLook";

/**
 * The hero part comes apart once when it scrolls into view, then holds the
 * exploded view. Sets data-state on the hero so the spec callouts can follow.
 */
export default function HeroMedia() {
  const look = LOOKS[useLook()];
  const ref = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");

  const [reduced, setReduced] = useState(false);
  const animated = Boolean(look.video) && !reduced;

  useEffect(() => {
    const r = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(r);
    if (r || !look.video) { setState("done"); return; }
    setState("idle");
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && v.paused && !v.ended) v.play().then(() => setState("playing")).catch(() => setState("done"));
    }, { threshold: 0.4 });
    io.observe(v);
    return () => io.disconnect();
  }, [look]);

  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.closest<HTMLElement>(".hx")?.setAttribute("data-state", state);
  }, [state]);

  const replay = () => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().then(() => setState("playing")).catch(() => {});
  };

  return (
    <div className="hx-media" ref={box}>
      {animated ? (
        <video
          key={look.id}
          ref={ref}
          src={look.video}
          poster={look.poster}
          muted
          playsInline
          preload="auto"
          onEnded={() => setState("done")}
          aria-label="A 3D-printed gearbox separating into its parts"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={look.id} src={look.still} alt="A 3D-printed gearbox shown as an exploded view of its parts" />
      )}
      {animated && state === "done" && (
        <button type="button" className="hx-replay" onClick={replay}>Replay</button>
      )}
    </div>
  );
}
