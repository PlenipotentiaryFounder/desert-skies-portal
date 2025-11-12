import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Info } from "lucide-react"
import { OrganizationSettingsForm } from "@/components/admin/organization-settings-form"
import { getOrCreateOrganizationSettings } from "@/lib/organization-settings-service"

export const metadata = {
  title: "Organization Settings | Desert Skies Aviation",
  description: "Manage organization-wide settings and configurations",
}

export default async function OrganizationSettingsPage() {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect("/login")
  }

  // Get or create organization settings
  const settings = await getOrCreateOrganizationSettings()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Organization Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure organization-wide settings and preferences
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          These settings apply to all users in the organization. Changes take effect immediately.
        </AlertDescription>
      </Alert>

      {/* Settings Cards */}
      <div className="grid gap-6">
        {/* Pre-Brief & Plan of Action Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pre-Brief & Plan of Action</CardTitle>
            <CardDescription>
              Configure requirements for mission pre-briefing workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrganizationSettingsForm settings={settings} />
          </CardContent>
        </Card>

        {/* Future Settings Sections */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>
              Configure pre-flight risk assessment requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Risk assessment settings will be available in a future update.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications & Reminders</CardTitle>
            <CardDescription>
              Configure mission reminders and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Notification settings will be available in a future update.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduling</CardTitle>
            <CardDescription>
              Configure scheduling rules and restrictions
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Scheduling settings will be available in a future update.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing & Payments</CardTitle>
            <CardDescription>
              Configure billing preferences and payment requirements
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Billing settings will be available in a future update.
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

