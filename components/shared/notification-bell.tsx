"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/providers/supabase-provider"
import { NotificationDropdown } from "./notification-dropdown"

export function NotificationBell() {
  const { user } = useSupabase()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      const res = await fetch(`/api/notifications/unread?userId=${user.id}`)
      const data = await res.json()
      setUnreadCount(data.count)
    }

    fetchUnreadCount()

    // Set up real-time subscription for new notifications
    const setupSubscription = async () => {
      const { supabase } = await import("@/lib/supabase/client")

      const subscription = supabase
        .channel("notification-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
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
  }, [user])

  if (!user) return null

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

      {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
    </div>
  )
}
