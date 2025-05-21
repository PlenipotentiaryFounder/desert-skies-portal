import type React from "react"
import { redirect } from "next/navigation"
import { BookOpen, Calendar, ClipboardCheck, FileText, Home, Plane, Settings, User } from "lucide-react"
import { createServerSupabaseClient, getUserRole } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/shared/dashboard-shell"

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
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const role = await getUserRole()

  if (role !== "student") {
    redirect("/")
  }

  return (
    <DashboardShell navItems={navItems} userRole="student">
      {children}
    </DashboardShell>
  )
}
