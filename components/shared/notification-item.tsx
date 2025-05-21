"use client"

import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Bell, Calendar, FileText, AlertCircle, BookOpen, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Notification, type NotificationCategory } from "@/lib/notification-service"

interface NotificationItemProps {
  notification: Notification
  onClose?: () => void
}

const categoryIcons: Record<NotificationCategory, LucideIcon> = {
  document_expiration: FileText,
  flight_reminder: Calendar,
  system_announcement: AlertCircle,
  new_document: FileText,
  syllabus_update: BookOpen,
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter()

  const handleClick = async () => {
    if (!notification.isRead) {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notification.id }),
      })
    }

    if (notification.link) {
      router.push(notification.link)
      if (onClose) onClose()
    }
  }

  const Icon = categoryIcons[notification.category] || Bell
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })

  return (
    <div
      className={cn(
        "p-4 border-b cursor-pointer hover:bg-muted transition-colors",
        !notification.isRead && "bg-muted/50",
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <p className={cn("text-sm", !notification.isRead && "font-medium")}>{notification.title}</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
      </div>
    </div>
  )
}
