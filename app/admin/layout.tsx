import type React from "react"
import { redirect } from "next/navigation"
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
import { createServerSupabaseClient, getUserRole } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/shared/dashboard-shell"

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
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  const role = await getUserRole()

  if (role !== "admin") {
    redirect("/")
  }

  return (
    <DashboardShell navItems={navItems} userRole="admin">
      {children}
    </DashboardShell>
  )
}
