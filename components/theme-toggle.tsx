"use client";

import { Palette } from "lucide-react";
import { useSyncExternalStore } from "react";

type MapWikiTheme = "v1" | "v2";

const storageKey = "mapwiki-theme";

function readTheme(): MapWikiTheme {
  if (typeof window === "undefined") return "v2";
  const stored = window.localStorage.getItem(storageKey);
  return stored === "v1" || stored === "v2" ? stored : "v2";
}

function applyTheme(theme: MapWikiTheme) {
  document.documentElement.dataset.mapwikiTheme = theme;
  window.localStorage.setItem(storageKey, theme);
  window.dispatchEvent(new Event("mapwiki-theme-change"));
}

function subscribeTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("mapwiki-theme-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("mapwiki-theme-change", onStoreChange);
  };
}

function getThemeSnapshot() {
  return readTheme();
}

function getThemeServerSnapshot(): MapWikiTheme {
  return "v2";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);

  const toggleTheme = () => {
    const nextTheme = theme === "v2" ? "v1" : "v2";
    applyTheme(nextTheme);
  };

  return (
    <button
      type="button"
      className="fixed bottom-4 left-16 z-[70] flex h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 text-xs font-medium text-neutral-900 shadow-[0_14px_32px_rgba(0,0,0,0.12)] backdrop-blur transition hover:bg-white"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "v2" ? "v1" : "v2"} theme`}
      title={`Switch to ${theme === "v2" ? "v1" : "v2"} theme`}
    >
      <Palette className="h-4 w-4" />
      <span>{theme.toUpperCase()}</span>
    </button>
  );
}
