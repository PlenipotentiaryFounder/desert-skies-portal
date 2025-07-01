import type React from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { AuthenticatedUser } from "@/types/user"
import { DashboardNav } from "@/components/shared/dashboard-nav"
import { UserNav } from "@/components/shared/user-nav"
import { MobileNav } from "@/components/shared/mobile-nav"

interface DashboardShellProps {
  children: ReactNode
  navItems: {
    title: string
    href: string
    icon: string
  }[]
  userRole: "admin" | "instructor" | "student"
  profile: AuthenticatedUser | null
}

export function DashboardShell({ children, navItems, userRole, profile }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <MobileNav navItems={navItems} userRole={userRole} />
            <Link href="/" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M12 19l9 2-9-18-9 18 9-2z" />
              </svg>
              <span className="hidden font-bold sm:inline-block">Desert Skies Aviation</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <UserNav profile={profile} />
          </div>
        </div>
      </header>
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <DashboardNav items={navItems} profile={profile} />
        </aside>
        <main className="flex w-full flex-col overflow-hidden pt-6">{children}</main>
      </div>
    </div>
  )
}
