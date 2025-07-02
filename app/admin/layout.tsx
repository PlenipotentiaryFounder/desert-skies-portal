import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import {
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home,
  Plane,
  Settings,
  User,
  Users,
  UserCheck,
} from "lucide-react"
import { DashboardShell } from "@/components/shared/dashboard-shell"
import { getUserProfileWithRoles } from "@/lib/user-service"

const navItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: "home",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: "users",
  },
  {
    title: "Instructor Approvals",
    href: "/admin/instructors",
    icon: "userCheck",
  },
  {
    title: "Syllabi",
    href: "/admin/syllabi",
    icon: "bookOpen",
  },
  {
    title: "Enrollments",
    href: "/admin/enrollments",
    icon: "graduationCap",
  },
  {
    title: "Aircraft",
    href: "/admin/aircraft",
    icon: "plane",
  },
  {
    title: "Schedule",
    href: "/admin/schedule",
    icon: "calendar",
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: "fileText",
  },
  {
    title: "Requirements",
    href: "/admin/requirements",
    icon: "clipboardCheck",
  },
  {
    title: "Profile",
    href: "/admin/profile",
    icon: "user",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: "settings",
  },
]

export default async function AdminLayout({
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
  console.log('ADMIN LAYOUT: profile:', profile)
  const roles = Array.isArray(profile?.roles)
    ? profile.roles.map((r: any) => typeof r === "string" ? r : r.role_name)
    : []
  console.log('ADMIN LAYOUT: roles:', roles)

  if (!roles.includes("admin")) {
    redirect("/")
  }

  return (
    <DashboardShell navItems={navItems} userRole="admin" profile={profile}>
      {children}
    </DashboardShell>
  )
}
