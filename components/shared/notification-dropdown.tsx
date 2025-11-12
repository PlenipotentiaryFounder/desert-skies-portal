"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { type Notification } from "@/lib/notification-service"
import { NotificationItem } from "./notification-item"
import { createClient } from "@/lib/supabase/client"
import { AuthenticatedUser } from "@/types/user"

interface NotificationDropdownProps {
  onClose: () => void
  profile: AuthenticatedUser | null
}

export function NotificationDropdown({ onClose, profile }: NotificationDropdownProps) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!profile) return

    const fetchNotifications = async () => {
      setLoading(true)
      const res = await fetch(`/api/notifications?userId=${profile.id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      setNotifications(data)
      setLoading(false)
    }

    fetchNotifications()
  }, [profile])

  const handleMarkAllAsRead = async () => {
    if (!profile) return

    await fetch("/api/notifications/mark-all-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.id }),
    })
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
  }

  const handleViewAllNotifications = () => {
    if (!profile) return
    const userRole = profile.roles?.[0]?.role_name || 'student'
    router.push(`/${userRole}/notifications`)
    onClose()
  }

  return (
    <div className="absolute right-0 mt-2 w-80 rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 z-50">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="text-sm font-medium">Notifications</h3>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleMarkAllAsRead}
            aria-label="Mark all as read"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close notifications">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-[400px]">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onClose={onClose} />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t">
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleViewAllNotifications}>
          View all notifications
        </Button>
      </div>
    </div>
  )
}
