import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { SerwistProvider } from "@serwist/turbopack/react";
import MobileBottomNav from "@/components/shared/mobile-bottom-nav";
import { Agentation } from "agentation";


const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  applicationName: "UmrahQu",
  title: {
    default: "UmrahQu - Teman Perjalanan Terbaikmu",
    template: "%s | UmrahQu",
  },
  description: "Teman Perjalanan Terbaikmu",
  icons: {
    icon: "/logo-icon.svg",

  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "h-full",
        jakarta.variable,
        geistMono.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
            {process.env.NODE_ENV === "development" && <Agentation />}
        <Providers>
          <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
        </Providers>
        <Toaster
          position="top-right"
          offset={80}
          richColors
          closeButton
          expand
          visibleToasts={3}
          duration={3000}
        />
        <MobileBottomNav />
      </body>
    </html>
  );
}
