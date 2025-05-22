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

  // session.user.id is always a string (UUID) in our schema
  const userId = session.user.id as string
  // @ts-expect-error: Supabase type inference issue, id is string
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, metadata").eq("id", userId).single()
  // Type guard to ensure profile is the expected object
  function isProfile(obj: any): obj is { role: string; metadata?: { additional_roles?: string[] } } {
    return obj && typeof obj === "object" && "role" in obj;
  }
  if (profileError || !isProfile(profile)) {
    redirect("/login")
  }
  const additionalRoles = profile.metadata?.additional_roles || []
  const isStudent = profile.role === "student" || additionalRoles.includes("student") || profile.role === "admin"

  if (!isStudent) {
    redirect("/")
  }

  return (
    <DashboardShell navItems={navItems} userRole="student">
      {children}
    </DashboardShell>
  )
}
