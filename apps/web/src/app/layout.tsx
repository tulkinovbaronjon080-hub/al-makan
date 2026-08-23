import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/nav/app-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Al-Makan",
  description: "Business operating system for window & door manufacturers",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a3fcc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <QueryProvider>
          <AppShell>{children}</AppShell>
        </QueryProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
