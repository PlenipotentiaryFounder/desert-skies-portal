"use server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export type NotificationCategory =
  | "document_expiration"
  | "flight_reminder"
  | "system_announcement"
  | "new_document"
  | "syllabus_update"

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  link?: string
  isRead: boolean
  category: NotificationCategory
  createdAt: string
  expiresAt?: string
  relatedEntityId?: string
  relatedEntityType?: string
}

export interface NotificationSettings {
  id: string
  userId: string
  emailEnabled: boolean
  pushEnabled: boolean
  inAppEnabled: boolean
  documentExpiration: boolean
  flightReminders: boolean
  systemAnnouncements: boolean
  newDocuments: boolean
  syllabusUpdates: boolean
  createdAt: string
  updatedAt: string
}

export async function getNotifications(userId: string, limit = 10): Promise<Notification[]> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("Error fetching notifications:", error)
    return []
  }

  return data.map((notification) => ({
    id: notification.id,
    userId: notification.user_id,
    title: notification.title,
    message: notification.message,
    link: notification.link,
    isRead: notification.is_read,
    category: notification.category as NotificationCategory,
    createdAt: notification.created_at,
    expiresAt: notification.expires_at,
    relatedEntityId: notification.related_entity_id,
    relatedEntityType: notification.related_entity_type,
  }))
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error fetching unread notification count:", error)
    return 0
  }

  return count || 0
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId)

  if (error) {
    console.error("Error marking notification as read:", error)
    return false
  }

  return true
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    return false
  }

  return true
}

export async function createNotification(
  notification: Omit<Notification, "id" | "createdAt" | "isRead">,
): Promise<string | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      category: notification.category,
      expires_at: notification.expiresAt,
      related_entity_id: notification.relatedEntityId,
      related_entity_type: notification.relatedEntityType,
    })
    .select("id")
    .single()

  if (error) {
    console.error("Error creating notification:", error)
    return null
  }

  return data.id
}

export async function getNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase.from("notification_settings").select("*").eq("user_id", userId).single()

  if (error) {
    if (error.code === "PGRST116") {
      // No settings found, create default settings
      return createDefaultNotificationSettings(userId)
    }
    console.error("Error fetching notification settings:", error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    emailEnabled: data.email_enabled,
    pushEnabled: data.push_enabled,
    inAppEnabled: data.in_app_enabled,
    documentExpiration: data.document_expiration,
    flightReminders: data.flight_reminders,
    systemAnnouncements: data.system_announcements,
    newDocuments: data.new_documents,
    syllabusUpdates: data.syllabus_updates,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export async function updateNotificationSettings(
  settings: Partial<NotificationSettings> & { userId: string },
): Promise<boolean> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { error } = await supabase
    .from("notification_settings")
    .update({
      email_enabled: settings.emailEnabled,
      push_enabled: settings.pushEnabled,
      in_app_enabled: settings.inAppEnabled,
      document_expiration: settings.documentExpiration,
      flight_reminders: settings.flightReminders,
      system_announcements: settings.systemAnnouncements,
      new_documents: settings.newDocuments,
      syllabus_updates: settings.syllabusUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", settings.userId)

  if (error) {
    console.error("Error updating notification settings:", error)
    return false
  }

  return true
}

async function createDefaultNotificationSettings(userId: string): Promise<NotificationSettings | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const defaultSettings = {
    user_id: userId,
    email_enabled: true,
    push_enabled: true,
    in_app_enabled: true,
    document_expiration: true,
    flight_reminders: true,
    system_announcements: true,
    new_documents: true,
    syllabus_updates: true,
  }

  const { data, error } = await supabase.from("notification_settings").insert(defaultSettings).select("*").single()

  if (error) {
    console.error("Error creating default notification settings:", error)
    return null
  }

  return {
    id: data.id,
    userId: data.user_id,
    emailEnabled: data.email_enabled,
    pushEnabled: data.push_enabled,
    inAppEnabled: data.in_app_enabled,
    documentExpiration: data.document_expiration,
    flightReminders: data.flight_reminders,
    systemAnnouncements: data.system_announcements,
    newDocuments: data.new_documents,
    syllabusUpdates: data.syllabus_updates,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
