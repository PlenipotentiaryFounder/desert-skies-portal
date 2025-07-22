"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { NotificationItem } from "@/components/shared/notification-item"
import { Switch } from "@/components/ui/switch"
import { type Notification, type NotificationSettings } from "@/lib/notification-service"

export default function InstructorNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)
      const res = await fetch(`/api/notifications?userId=${user.id}`)
      const data = await res.json()
      setNotifications(data)
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  useEffect(() => {
    async function fetchSettings() {
      setSettingsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setSettingsLoading(false)
      const res = await fetch(`/api/notification-settings?userId=${user.id}`)
      if (res.ok) {
        setSettings(await res.json())
      }
      setSettingsLoading(false)
    }
    fetchSettings()
  }, [supabase])

  const handleMarkAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await fetch("/api/notifications/mark-all-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id })
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleSettingChange = async (field: keyof NotificationSettings, value: boolean) => {
    if (!settings) return
    setSettingsSaving(true)
    const updated = { ...settings, [field]: value }
    setSettings(updated)
    await fetch("/api/notification-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    })
    setSettingsSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>All your recent notifications</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={loading}>
            Mark all as read
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">No notifications</div>
          ) : (
            <div>
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Control how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settingsLoading || !settings ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Email Notifications</span>
                <Switch checked={settings.emailEnabled} onCheckedChange={v => handleSettingChange("emailEnabled", v)} disabled={settingsSaving} />
              </div>
              <div className="flex items-center justify-between">
                <span>Push Notifications</span>
                <Switch checked={settings.pushEnabled} onCheckedChange={v => handleSettingChange("pushEnabled", v)} disabled={settingsSaving} />
              </div>
              <div className="flex items-center justify-between">
                <span>In-App Notifications</span>
                <Switch checked={settings.inAppEnabled} onCheckedChange={v => handleSettingChange("inAppEnabled", v)} disabled={settingsSaving} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 