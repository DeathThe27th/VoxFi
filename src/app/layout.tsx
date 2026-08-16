import type { Metadata, Viewport } from "next";
import "./tailwind.css";
import "./globals.css";
import "./extended.css";
import "./detail.css";
import "./owner.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  title: "Vox — Speak finance into motion",
  description: "A voice-controlled onchain financial agent for X Layer.",
  applicationName: "Vox",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Vox" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, themeColor: "#f4f3ef" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}><AppProviders>{children}</AppProviders></body></html>;
}
