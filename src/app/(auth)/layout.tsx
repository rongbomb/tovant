import Link from "next/link";
import { LogoMark } from "@/components/home/logo-mark";
import { DesktopThemeToggle } from "@/components/home/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="home-page" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--home-font-label)",
            fontWeight: 800,
            fontSize: 17,
            letterSpacing: "0.02em",
          }}
        >
          <LogoMark />
          TOVANT
        </Link>
        <DesktopThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
