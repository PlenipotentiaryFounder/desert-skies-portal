"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3, Book, Calendar, FileText, Plane, Users, Home, UserCheck, BookOpen, GraduationCap, ClipboardCheck, User, Settings, LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { AuthenticatedUser } from "@/types/user"

const iconMap = {
  barChart3: BarChart3,
  book: Book,
  calendar: Calendar,
  fileText: FileText,
  plane: Plane,
  users: Users,
  home: Home,
  userCheck: UserCheck,
  bookOpen: BookOpen,
  graduationCap: GraduationCap,
  clipboardCheck: ClipboardCheck,
  user: User,
  settings: Settings,
}

interface DashboardNavProps {
  items: {
    title: string
    href: string
    icon: string
  }[]
  profile: AuthenticatedUser | null
}

export function DashboardNav({ items, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  let fullName = ""
  let initials = ""
  if (profile) {
    const firstName = profile.first_name || ""
    const lastName = profile.last_name || ""
    fullName = `${firstName} ${lastName}`.trim() || profile.email || ""
    initials = (firstName[0] || "") + (lastName[0] || "")
    if (!initials.trim()) {
      initials = profile.email?.slice(0, 2) || "U"
    }
  }

  const handleSettings = () => {
    if (profile) router.push(`/${profile.roles[0].role_name}/settings`)
  }

  const handleProfile = () => {
    if (profile) router.push(`/${profile.roles[0].role_name}/profile`)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      <nav className="grid items-start gap-2 flex-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon]
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: active ? "default" : "ghost", size: "sm" }),
                active ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "",
                "justify-start",
              )}
            >
              {Icon && <Icon className="mr-2 h-4 w-4" />}
              {item.title}
            </Link>
          )
        })}
      </nav>
      {/* Profile Card at the bottom of the sidebar */}
      {profile && (
        <div className="flex flex-col items-center gap-2 p-4 border-t mt-2">
          <Avatar className="h-12 w-12 cursor-pointer" onClick={handleProfile}>
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={fullName} />
            ) : (
              <User className="h-8 w-8 text-muted-foreground" />
            )}
            <AvatarFallback>{initials.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <div className="font-semibold text-sm">{fullName}</div>
            <div className="text-xs text-muted-foreground">{profile.email}</div>
            <div className="text-xs capitalize text-primary">{profile.roles.map(r => r.role_name).join(', ')}</div>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-xs border"
              onClick={handleProfile}
              title="Profile"
            >
              <User className="h-4 w-4" />
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent text-xs border"
              onClick={handleSettings}
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-destructive/10 text-xs border text-destructive"
              onClick={handleSignOut}
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
