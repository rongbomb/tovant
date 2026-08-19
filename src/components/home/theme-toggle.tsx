"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const KEY = "tovant_theme";

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function HomeThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (saved === "dark") {
      // Deferred to an effect (not a lazy useState initializer) so the
      // server-rendered light-mode markup matches the client's first
      // hydration pass; correcting to the saved theme happens right after.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDark(true);
      document.documentElement.setAttribute("data-home-theme", "dark");
    }
  }, []);

  function toggle() {
    setIsDark((prev) => {
      const next = !prev;
      if (next) document.documentElement.setAttribute("data-home-theme", "dark");
      else document.documentElement.removeAttribute("data-home-theme");
      try {
        localStorage.setItem(KEY, next ? "dark" : "light");
      } catch {}
      return next;
    });
  }

  return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>;
}

function useHomeTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useHomeTheme must be used within a HomeThemeProvider");
  return ctx;
}

const SunIcon = () => (
  <svg className="home-icon-sun" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <circle cx="12" cy="12" r="4.5" />
    <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" />
  </svg>
);

const MoonIcon = () => (
  <svg className="home-icon-moon" viewBox="0 0 24 24" fill="none" strokeWidth="2">
    <path d="M20 14.5A8.5 8.5 0 1110.2 4.2 6.8 6.8 0 0020 14.5z" />
  </svg>
);

export function DesktopThemeToggle() {
  const { isDark, toggle } = useHomeTheme();
  return (
    <button
      type="button"
      className={`home-theme-toggle${isDark ? " is-dark" : ""}`}
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}

export function ThemeFab() {
  const { isDark, toggle } = useHomeTheme();
  return (
    <button
      type="button"
      className={`home-theme-toggle home-theme-fab${isDark ? " is-dark" : ""}`}
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}
