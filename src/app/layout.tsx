import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import "./home.css";
import { HomeThemeProvider } from "@/components/home/theme-toggle";

export const metadata: Metadata = {
  title: "Tovant",
  description:
    "A trust-first marketplace connecting car owners with verified independent mechanics, mobile technicians, and detailers.",
};

// Runs before paint, outside React, so a saved dark preference is applied
// immediately instead of flashing light mode on every load — HomeThemeProvider's
// own effect-based sync (deliberately deferred so its first render matches
// SSR) then just reconciles against what this script already set.
const NO_FLASH_SCRIPT = `
  try {
    if (localStorage.getItem("tovant_theme") === "dark") {
      document.documentElement.setAttribute("data-home-theme", "dark");
    }
  } catch (e) {}
`;

// home.css is imported globally so any route can opt into the sage-green
// design system, but its rules are all scoped under `.home-page` (see that
// file's header comment) — a route that hasn't been migrated yet and never
// renders that class is completely unaffected. HomeThemeProvider is global
// too (it's just state), but visual theming only applies where `.home-page`
// is actually rendered, which each portal picks up as it migrates.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning is scoped to this element only (React only
    // ignores mismatches on the element it's set on, not descendants) — it
    // exists because NO_FLASH_SCRIPT intentionally sets data-home-theme on
    // <html> before hydration, outside React, which would otherwise log a
    // false-positive mismatch warning on every dark-mode page load.
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        {/* Regardless of where this sits in the tree, Next.js injects
            beforeInteractive scripts into the real HTML <head> itself —
            it does NOT belong inside a manually-written <head> tag here,
            which is the documented pattern and avoids Turbopack dev-mode
            re-processing it as an ordinary DOM node on any client re-render. */}
        <Script id="no-flash-theme" strategy="beforeInteractive">
          {NO_FLASH_SCRIPT}
        </Script>
        <HomeThemeProvider>{children}</HomeThemeProvider>
      </body>
    </html>
  );
}
