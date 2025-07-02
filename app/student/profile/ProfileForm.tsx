"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export default function ProfileForm({ profile }: { profile: any }) {
  const [form, setForm] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
    avatar_url: profile?.avatar_url || "",
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || "Unknown error")
      }
    } catch (err) {
      setError("Failed to update profile.")
    }
    setLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <Card className="shadow-md border bg-background">
        <CardContent className="flex flex-col md:flex-row gap-8 p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center md:items-start gap-4 md:w-1/3 border-r md:pr-8 pb-8 md:pb-0">
            <div className="relative group">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-accent shadow-lg bg-muted">
                <AvatarImage src={form.avatar_url || undefined} alt="Profile photo" />
                <AvatarFallback className="text-3xl md:text-4xl bg-accent text-accent-foreground">
                  {form.first_name?.[0]}{form.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              {/* Avatar upload coming soon */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-center opacity-70 text-xs text-muted-foreground pt-2">
                Profile Photo
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="font-semibold text-lg md:text-xl">{form.first_name} {form.last_name}</div>
              <div className="text-muted-foreground text-sm">{form.email}</div>
            </div>
          </div>
          {/* Form Fields Section */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required autoComplete="given-name" className="focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required autoComplete="family-name" className="focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" value={form.email} onChange={handleChange} type="email" required disabled className="bg-muted cursor-not-allowed" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} type="tel" autoComplete="tel" className="focus-visible:ring-2 focus-visible:ring-primary" />
            </div>
            <div className="flex flex-col gap-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} className="w-full rounded-md border border-input bg-background px-3 py-2 text-base min-h-[60px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" placeholder="Tell us a little about yourself..." />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2 border-t bg-muted/50 p-6">
          <Button type="submit" disabled={loading} className="w-full md:w-auto text-base font-semibold">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
          {success && <div className="text-green-600 text-sm">Profile updated!</div>}
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </CardFooter>
      </Card>
    </form>
  )
} 