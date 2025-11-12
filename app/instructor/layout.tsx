import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getUserProfileWithRoles } from "@/lib/user-service"
import { BookOpen, Calendar, ClipboardCheck, FileText, Home, Plane, Settings, User, Users } from "lucide-react"
import { DashboardShell } from "@/components/shared/dashboard-shell"
import { cookies } from "next/headers"
import "react-big-calendar/lib/css/react-big-calendar.css"

const navItems = [
  {
    title: "Dashboard",
    href: "/instructor/dashboard",
    icon: "home",
  },
  {
    title: "Students",
    href: "/instructor/students",
    icon: "users",
  },
  {
    title: "Missions",
    href: "/instructor/missions",
    icon: "rocket",
  },
  {
    title: "Syllabi",
    href: "/instructor/syllabi",
    icon: "bookOpen",
  },
  {
    title: "Schedule",
    href: "/instructor/schedule",
    icon: "calendar",
  },
  {
    title: "Availability",
    href: "/instructor/availability",
    icon: "clock",
  },
  {
    title: "Time Off",
    href: "/instructor/time-off",
    icon: "sun",
  },
  {
    title: "Logbook",
    href: "/instructor/logbook",
    icon: "book",
  },
  {
    title: "Documents",
    href: "/instructor/documents",
    icon: "fileText",
  },
  {
    title: "Maintenance",
    href: "/instructor/maintenance",
    icon: "wrench",
  },
  {
    title: "Endorsements",
    href: "/instructor/endorsements",
    icon: "clipboardCheck",
  },
  {
    title: "Profile",
    href: "/instructor/profile",
    icon: "user",
  },
  {
    title: "Settings",
    href: "/instructor/settings",
    icon: "settings",
  },
]

export default async function InstructorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)
  const roles = profile?.roles || []

  const canAccessInstructor = roles.some((r: any) => (typeof r === 'string' ? r : r.role_name) === "instructor")
  const canAccessAdmin = roles.some((r: any) => (typeof r === 'string' ? r : r.role_name) === "admin")

  if (!canAccessInstructor && !canAccessAdmin) {
    redirect("/")
  }

  return (
    <DashboardShell navItems={navItems} userRole="instructor" profile={profile}>
      {children}
    </DashboardShell>
  )
}
