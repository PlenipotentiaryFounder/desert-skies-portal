import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import SupabaseProvider from "@/components/providers/supabase-provider"
import { cn } from "@/lib/utils"
import "./globals.css"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Desert Skies Aviation Training Portal",
  description: "Modern flight training management for students, instructors, and administrators",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  if (error) {
    console.error('Error fetching user:', error)
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.className)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SupabaseProvider initialSession={session}>
            {children}
            <Toaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
