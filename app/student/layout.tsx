import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { BookOpen, Calendar, ClipboardCheck, FileText, Home, Plane, Settings, User } from "lucide-react"
import { DashboardShell } from "@/components/shared/dashboard-shell"
import { getUserProfileWithRoles } from "@/lib/user-service"

const navItems = [
  {
    title: "Dashboard",
    href: "/student/dashboard",
    icon: "home",
  },
  {
    title: "Syllabus",
    href: "/student/syllabus",
    icon: "bookOpen",
  },
  {
    title: "Flight Sessions",
    href: "/student/flight-sessions",
    icon: "plane",
  },
  {
    title: "Schedule",
    href: "/student/schedule",
    icon: "calendar",
  },
  {
    title: "Documents",
    href: "/student/documents",
    icon: "fileText",
  },
  {
    title: "FAA Requirements",
    href: "/student/requirements",
    icon: "clipboardCheck",
  },
  {
    title: "Profile",
    href: "/student/profile",
    icon: "user",
  },
  {
    title: "Settings",
    href: "/student/settings",
    icon: "settings",
  },
]

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)
  const roles = profile?.roles.map((r: { role_name: string }) => r.role_name) || []

  const canAccessStudent = roles.includes("student")
  const canAccessAdmin = roles.includes("admin")

  if (!canAccessStudent && !canAccessAdmin) {
    redirect("/")
  }

  return (
    <DashboardShell navItems={navItems} userRole="student" profile={profile}>
      {children}
    </DashboardShell>
  )
}
