"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import type { OrganizationSettings } from "@/lib/organization-settings-service"

interface OrganizationSettingsFormProps {
  settings: OrganizationSettings
}

export function OrganizationSettingsForm({ settings }: OrganizationSettingsFormProps) {
  const [requirePOAAcknowledgement, setRequirePOAAcknowledgement] = useState(
    settings.require_poa_acknowledgement
  )
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleToggle = (checked: boolean) => {
    setRequirePOAAcknowledgement(checked)
    setHasChanges(checked !== settings.require_poa_acknowledgement)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/admin/settings/organization", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          require_poa_acknowledgement: requirePOAAcknowledgement,
        }),
        credentials: "include",
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update settings")
      }

      toast({
        title: "Settings updated",
        description: "Organization settings have been saved successfully.",
      })

      setHasChanges(false)
      router.refresh()
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setRequirePOAAcknowledgement(settings.require_poa_acknowledgement)
    setHasChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Require POA Acknowledgement */}
      <div className="flex items-start justify-between space-x-4">
        <div className="flex-1 space-y-1">
          <Label htmlFor="require-poa-ack" className="text-base font-medium">
            Require POA Acknowledgement Before Pre-Brief
          </Label>
          <p className="text-sm text-muted-foreground">
            When enabled, instructors cannot complete the pre-brief until the student 
            has reviewed and acknowledged the Plan of Action. When disabled, student 
            acknowledgement is optional but encouraged.
          </p>
        </div>
        <Switch
          id="require-poa-ack"
          checked={requirePOAAcknowledgement}
          onCheckedChange={handleToggle}
        />
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isSaving}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      )}

      {!hasChanges && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            No unsaved changes. Make changes above and click "Save Changes" to update.
          </p>
        </div>
      )}
    </div>
  )
}

