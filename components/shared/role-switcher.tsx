"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronsUpDown } from "lucide-react"

interface RoleSwitcherProps {
  roles: string[]
}

export function RoleSwitcher({ roles }: RoleSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSwitch = (role: string) => {
    router.push(`/${role}/dashboard`)
  }

  const getCurrentDashboardRole = () => {
    const pathParts = pathname.split('/')
    if (pathParts.length > 1 && (roles.includes(pathParts[1]))) {
      return pathParts[1]
    }
    return 'dashboard' 
  }

  const currentDashboardRole = getCurrentDashboardRole()

  if (!roles || roles.length < 2) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center justify-between w-full">
            <span className="capitalize">{currentDashboardRole}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Switch Dashboard</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {roles.map((role) => (
          <DropdownMenuItem
            key={role}
            onClick={() => handleSwitch(role)}
            disabled={role === currentDashboardRole}
          >
            <span className="capitalize">{role}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
