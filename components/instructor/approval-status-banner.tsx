"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ApprovalStatusBannerProps {
  userId: string
}

export function ApprovalStatusBanner({ userId }: ApprovalStatusBannerProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkApprovalStatus() {
      try {
        const { data, error } = await supabase.from("profiles").select("status").eq("id", userId).single()

        if (error) throw error
        setStatus(data?.status || null)
      } catch (error) {
        console.error("Error checking approval status:", error)
      } finally {
        setLoading(false)
      }
    }

    checkApprovalStatus()
  }, [userId, supabase])

  if (loading || !status || status === "active") {
    return null
  }

  if (status === "pending") {
    return (
      <Alert variant="warning" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Approval Pending</AlertTitle>
        <AlertDescription>
          Your instructor account is pending approval by an administrator. You can explore the platform, but some
          features will be limited until your account is approved.
        </AlertDescription>
      </Alert>
    )
  }

  if (status === "inactive") {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Account Inactive</AlertTitle>
        <AlertDescription>
          Your instructor account has been deactivated. Please contact an administrator for assistance.
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
