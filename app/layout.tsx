import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SiteHeader } from "@/components/shared/site-header"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Desert Skies Portal",
  description: "Flight Training Portal for Desert Skies",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative flex min-h-screen flex-col">
            {/* SiteHeader is only for public/marketing pages. Portal pages (admin/instructor/student) use DashboardShell for their header. */}
            {/* <SiteHeader /> */}
            <div className="flex-1">{children}</div>
            <footer className="w-full border-t bg-background py-6 mt-8">
              <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>&copy; {new Date().getFullYear()} Desert Skies Aviation</span>
                <div className="flex gap-4">
                  <a href="/legal/privacy-policy" className="hover:underline">Privacy Policy</a>
                  <a href="/legal/terms" className="hover:underline">Terms & Conditions</a>
                </div>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
