import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-context"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Popular Pharmacy",
  description: "Retail Pharmacy Management",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-background text-foreground">
        <AuthProvider>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen text-lg font-medium">
                Loading...
              </div>
            }
          >
            {children}
          </Suspense>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
