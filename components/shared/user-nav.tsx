"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AuthenticatedUser } from "@/types/user"
import { CheckCircle } from "lucide-react"

interface UserNavProps {
  profile: AuthenticatedUser | null
}

export function UserNav({ profile }: UserNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (!profile) {
    return (
      <Button asChild>
        <a href="/login">Log In</a>
      </Button>
    )
  }
  
  const { first_name, last_name, avatar_url, roles, email } = profile
  const userRoles = roles.map(r => r.role_name)
  const fullName = [first_name, last_name].filter(Boolean).join(" ")
  const userInitials = (first_name?.[0] ?? '') + (last_name?.[0] ?? '')

  // Map roles to dashboard info
  const dashboards = [
    userRoles.includes("instructor") && {
      label: "Instructor Dashboard",
      path: "/instructor/dashboard",
      role: "instructor"
    },
    userRoles.includes("admin") && {
      label: "Admin Dashboard",
      path: "/admin/dashboard",
      role: "admin"
    }
  ].filter(Boolean)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatar_url || ''} alt={fullName || email} />
            <AvatarFallback>{userInitials.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Dashboards</DropdownMenuLabel>
        {dashboards.map(dash => {
          const isActive = pathname.startsWith(dash.path)
          return (
            <DropdownMenuItem
              key={dash.role}
              onClick={() => router.push(dash.path)}
              className={
                isActive
                  ? "font-bold text-sky-600 dark:text-yellow-300 bg-sky-100 dark:bg-blue-900/40 flex items-center gap-2"
                  : "flex items-center gap-2"
              }
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && <CheckCircle className="h-4 w-4 text-sky-500 dark:text-yellow-300" aria-hidden="true" />}
              <span>{dash.label}</span>
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
