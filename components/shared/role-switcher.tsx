"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CurrencyIcon as Exchange } from "lucide-react"

interface RoleSwitcherProps {
  currentRole: "admin" | "instructor"
  hasAdditionalRole: boolean
}

export function RoleSwitcher({ currentRole, hasAdditionalRole }: RoleSwitcherProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (!hasAdditionalRole) {
    return null
  }

  const handleSwitch = () => {
    setIsLoading(true)
    if (currentRole === "admin") {
      router.push("/instructor/dashboard")
    } else {
      router.push("/admin/dashboard")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleSwitch} disabled={isLoading} className="ml-auto">
      <Exchange className="mr-2 h-4 w-4" />
      {currentRole === "admin" ? "Switch to Instructor View" : "Switch to Admin View"}
    </Button>
  )
}
