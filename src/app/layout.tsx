import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tovant",
  description:
    "A trust-first marketplace connecting car owners with verified independent mechanics, mobile technicians, and detailers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
