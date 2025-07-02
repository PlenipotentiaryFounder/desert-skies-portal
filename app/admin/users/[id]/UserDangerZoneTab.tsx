"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DeleteUserDialog } from "../delete-user-dialog"
import { useRouter } from "next/navigation"

interface UserDangerZoneTabProps {
  userId: string
  userName: string
}

export default function UserDangerZoneTab({ userId, userName }: UserDangerZoneTabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleComplete = (success: boolean) => {
    setIsOpen(false)
    if (success) {
      router.push("/admin/users")
      router.refresh()
    }
  }

  return (
    <Card>
      <CardContent className="py-8">
        <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
        <p className="mb-4">Delete this user and all associated data. This action cannot be undone.</p>
        <Button variant="destructive" onClick={() => setIsOpen(true)}>
          Delete {userName}
        </Button>
        <DeleteUserDialog isOpen={isOpen} userId={userId} onComplete={handleComplete} />
      </CardContent>
    </Card>
  )
} 