import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { MobileTabBarShell } from "@/components/MobileTabBarShell";
import { Navbar } from "@/components/Navbar";
import { ToastProvider } from "@/components/ToastProvider";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Piccolo — Meno rumore. Più relazione.",
  description: "Il social privato per gruppi e community controllate. Crea uno spazio raccolto, sicuro e facile da gestire.",
  icons: {
    icon: "/brand/piccolo-icon.webp",
    apple: "/brand/piccolo-icon.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const theme =
    user?.theme_preference === "dark"
      ? "theme-dark"
      : user?.theme_preference === "light"
        ? "theme-light"
        : "theme-system";

  return (
    <html
      lang="it"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${theme} h-full antialiased`}
    >
      <body className="min-h-full bg-paper text-charcoal">
        <Navbar />
        {children}
        <ToastProvider />
        <MobileTabBarShell />
      </body>
    </html>
  );
}
