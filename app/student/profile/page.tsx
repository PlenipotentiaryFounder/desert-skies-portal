import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/shared/dashboard-shell"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import Link from "next/link"
import { getUserProfileWithRoles, updateUser } from "@/lib/user-service"

export default async function StudentProfilePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const profile = await getUserProfileWithRoles(user.id)

  return (
    <DashboardShell navItems={[]} userRole="student" profile={profile}>
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>View and update your profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading...</div>}>
              <ProfileForm profile={profile} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>Change your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reset-password">
              <Button variant="outline">Change Password</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}

function ProfileForm({ profile }: { profile: any }) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={form.avatar_url || undefined} alt="Profile photo" />
          <AvatarFallback>{form.first_name?.[0]}{form.last_name?.[0]}</AvatarFallback>
        </Avatar>
        {/* Avatar upload not implemented yet */}
      </div>
      <div>
        <Label htmlFor="first_name">First Name</Label>
        <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="last_name">Last Name</Label>
        <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" value={form.email} onChange={handleChange} type="email" required disabled />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" value={form.phone} onChange={handleChange} type="tel" />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} className="w-full rounded border p-2 min-h-[60px]" />
      </div>
      <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</Button>
      {success && <div className="text-green-600">Profile updated!</div>}
      {error && <div className="text-red-500">{error}</div>}
    </form>
  )
} 