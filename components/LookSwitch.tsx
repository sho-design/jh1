"use client";

import { LOOKS, type LookId } from "@/lib/looks";
import { setLook, useLook } from "./useLook";

export default function LookSwitch() {
  const look = useLook();
  return (
    <div className="look-switch" role="group" aria-label="Design direction">
      <span>Direction</span>
      {(Object.keys(LOOKS) as LookId[]).map((id) => (
        <button key={id} type="button" aria-pressed={look === id} onClick={() => setLook(id)}>
          <b>{id.toUpperCase()}</b> {LOOKS[id].name}
        </button>
      ))}
    </div>
  );
}
