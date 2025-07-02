"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function StudentSettingsPage() {
  // Notification preferences state
  const [notifSettings, setNotifSettings] = useState({
    emailEnabled: true,
    pushEnabled: false,
    inAppEnabled: true,
    documentExpiration: true,
    flightReminders: true,
    systemAnnouncements: true,
    newDocuments: true,
    syllabusUpdates: true,
  })
  const [notifLoading, setNotifLoading] = useState(true)
  const [notifSaving, setNotifSaving] = useState(false)
  const [notifSuccess, setNotifSuccess] = useState(false)
  const [notifError, setNotifError] = useState("")

  useEffect(() => {
    async function fetchSettings() {
      setNotifLoading(true)
      setNotifError("")
      try {
        const res = await fetch("/api/notifications/settings", { method: "GET" })
        if (res.ok) {
          const data = await res.json()
          setNotifSettings(data)
        }
      } catch (err) {
        setNotifError("Failed to load notification settings.")
      }
      setNotifLoading(false)
    }
    fetchSettings()
  }, [])

  async function handleNotifSave() {
    setNotifSaving(true)
    setNotifError("")
    setNotifSuccess(false)
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notifSettings),
      })
      if (res.ok) {
        setNotifSuccess(true)
      } else {
        setNotifError("Failed to save settings.")
      }
    } catch (err) {
      setNotifError("Failed to save settings.")
    }
    setNotifSaving(false)
  }

  function handleNotifToggle(key: string) {
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive important updates.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {notifLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span>Email Notifications</span>
                <Switch checked={notifSettings.emailEnabled} onCheckedChange={() => handleNotifToggle("emailEnabled")} />
              </div>
              <div className="flex items-center justify-between">
                <span>Push Notifications</span>
                <Switch checked={notifSettings.pushEnabled} onCheckedChange={() => handleNotifToggle("pushEnabled")} />
              </div>
              <div className="flex items-center justify-between">
                <span>In-App Notifications</span>
                <Switch checked={notifSettings.inAppEnabled} onCheckedChange={() => handleNotifToggle("inAppEnabled")} />
              </div>
              <div className="flex items-center justify-between">
                <span>Document Expiration Alerts</span>
                <Switch checked={notifSettings.documentExpiration} onCheckedChange={() => handleNotifToggle("documentExpiration")} />
              </div>
              <div className="flex items-center justify-between">
                <span>Flight Reminders</span>
                <Switch checked={notifSettings.flightReminders} onCheckedChange={() => handleNotifToggle("flightReminders")} />
              </div>
              <div className="flex items-center justify-between">
                <span>System Announcements</span>
                <Switch checked={notifSettings.systemAnnouncements} onCheckedChange={() => handleNotifToggle("systemAnnouncements")} />
              </div>
              <div className="flex items-center justify-between">
                <span>New Documents</span>
                <Switch checked={notifSettings.newDocuments} onCheckedChange={() => handleNotifToggle("newDocuments")} />
              </div>
              <div className="flex items-center justify-between">
                <span>Syllabus Updates</span>
                <Switch checked={notifSettings.syllabusUpdates} onCheckedChange={() => handleNotifToggle("syllabusUpdates")} />
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2">
          <Button onClick={handleNotifSave} disabled={notifLoading || notifSaving} className="w-full md:w-auto">
            {notifSaving ? "Saving..." : "Save Preferences"}
          </Button>
          {notifSuccess && <div className="text-green-600 text-sm">Preferences saved!</div>}
          {notifError && <div className="text-red-500 text-sm">{notifError}</div>}
        </CardFooter>
      </Card>
      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Control your profile visibility and data sharing preferences.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span>Show my profile to instructors</span>
            <Switch checked disabled />
          </div>
          <div className="flex items-center justify-between">
            <span>Allow data sharing for analytics</span>
            <Switch checked={false} disabled />
          </div>
        </CardContent>
      </Card>
      {/* Account Management */}
      <Card>
        <CardHeader>
          <CardTitle>Account Management</CardTitle>
          <CardDescription>Manage your account security and status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/reset-password">
            <Button variant="outline">Change Password</Button>
          </Link>
          <Button variant="destructive" disabled>Deactivate Account</Button>
        </CardContent>
      </Card>
      {/* Legal Section */}
      <Card>
        <CardHeader>
          <CardTitle>Legal</CardTitle>
          <CardDescription>Review our policies and terms.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href="/legal/privacy-policy" className="text-primary underline">Privacy Policy</Link>
          <Link href="/legal/terms" className="text-primary underline">Terms & Conditions</Link>
        </CardContent>
      </Card>
    </div>
  )
} 