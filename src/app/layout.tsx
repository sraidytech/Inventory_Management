import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Tajawal } from "next/font/google"
import "./globals.css"
import "./rtl.css"
import { ClerkProvider } from "@clerk/nextjs"
import { Toaster } from "sonner"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { ThemeScript } from "@/components/theme/theme-script"
import { ThemeScriptServer } from "@/components/theme/theme-script-server"
import { LanguageProvider } from "@/components/language/language-provider"
import { LanguageScriptServer } from "@/components/language/language-script-server"
import { NextIntlProvider } from "@/components/language/next-intl-provider"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "Inventory Management System",
  description: "A comprehensive inventory management system",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <ThemeScriptServer />
          <ThemeScript />
          <LanguageScriptServer />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} ${tajawal.variable} antialiased`}>
          <ThemeProvider>
            <LanguageProvider>
              <NextIntlProvider>
                {children}
                <Toaster />
              </NextIntlProvider>
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
