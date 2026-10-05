import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getCurrentUser } from "@/lib/current-user";
import { AuthSessionBoundary } from "@/components/auth-session-boundary";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "@/components/theme-provider";

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
  title: "PocketPilot - Personal Finance Manager",
  description: "Track your finances, manage accounts, and monitor spending with PocketPilot",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const user = userId ? await getCurrentUser() : null;
  return (
    <html lang={user?.language === "es" ? "es" : "en"} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up" signInFallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
        <LanguageProvider language={user?.language === "es" ? "es" : "en"}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthSessionBoundary legacyOwner={user?.id === "user-1"}>{children}</AuthSessionBoundary>
        </ThemeProvider>
        <Toaster position="bottom-right" />
        </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
