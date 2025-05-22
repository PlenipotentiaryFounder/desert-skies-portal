import type React from "react"
import { redirect } from "next/navigation"
import { BookOpen, Calendar, ClipboardCheck, FileText, Home, Plane, Settings, User, Users } from "lucide-react"
import { createServerSupabaseClient, getUserRole, getUserFromSession } from "@/lib/supabase/server"
import { DashboardShell } from "@/components/shared/dashboard-shell"

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
    title: "Syllabi",
    href: "/instructor/syllabi",
    icon: "bookOpen",
  },
  {
    title: "Flight Sessions",
    href: "/instructor/flight-sessions",
    icon: "plane",
  },
  {
    title: "Schedule",
    href: "/instructor/schedule",
    icon: "calendar",
  },
  {
    title: "Documents",
    href: "/instructor/documents",
    icon: "fileText",
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
  const user = await getUserFromSession()

  if (!user) {
    redirect("/login")
  }

  const supabase = await createServerSupabaseClient()
  // @ts-expect-error: Supabase type inference issue, id is string
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, metadata").eq("id", user.id).single()
  // Type guard to ensure profile is the expected object
  function isProfile(obj: any): obj is { role: string; metadata?: { additional_roles?: string[] } } {
    return obj && typeof obj === "object" && "role" in obj;
  }
  if (profileError || !isProfile(profile)) {
    redirect("/login")
  }
  const additionalRoles = profile.metadata?.additional_roles || []
  const isInstructor = profile.role === "instructor" || additionalRoles.includes("instructor") || profile.role === "admin"

  if (!isInstructor) {
    redirect("/")
  }

  return (
    <DashboardShell navItems={navItems} userRole="instructor">
      {children}
    </DashboardShell>
  )
}
