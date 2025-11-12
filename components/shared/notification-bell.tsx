"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "./notification-dropdown"
import { AuthenticatedUser } from "@/types/user"

interface NotificationBellProps {
  profile: AuthenticatedUser | null
}

export function NotificationBell({ profile }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!profile) return

    const fetchUnreadCount = async () => {
      const res = await fetch(`/api/notifications/unread?userId=${profile.id}`, {
        credentials: 'include'
      })
      const data = await res.json()
      setUnreadCount(data.count)
    }

    fetchUnreadCount()

    // Set up real-time subscription for new notifications
    const setupSubscription = async () => {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()

      const subscription = supabase
        .channel("notification-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${profile.id}`,
          },
          () => {
            fetchUnreadCount()
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    const unsubscribe = setupSubscription()

    return () => {
      if (unsubscribe) {
        unsubscribe.then((unsub) => unsub())
      }
    }
  }, [profile])

  if (!profile) return null

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} profile={profile} />}
    </div>
  )
}
