"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_LOOK, type LookId } from "@/lib/looks";

const read = (): LookId => (document.documentElement.dataset.look === "b" ? "b" : "a");

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-look"] });
  return () => mo.disconnect();
}

export function useLook(): LookId {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_LOOK);
}

export function setLook(id: LookId) {
  document.documentElement.dataset.look = id;
  try { localStorage.setItem("jh1-look", id); } catch { /* private mode */ }
  const url = new URL(location.href);
  url.searchParams.set("look", id);
  history.replaceState(null, "", url);
}
