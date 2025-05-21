"use client"

import { useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface WithApprovalCheckProps {
  userId: string
  children: ReactNode
  fallback?: ReactNode
}

export function WithApprovalCheck({ userId, children, fallback }: WithApprovalCheckProps) {
  const [isApproved, setIsApproved] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function checkApprovalStatus() {
      try {
        const { data, error } = await supabase.from("profiles").select("status").eq("id", userId).single()

        if (error) throw error
        setIsApproved(data?.status === "active")
      } catch (error) {
        console.error("Error checking approval status:", error)
        setIsApproved(false)
      } finally {
        setLoading(false)
      }
    }

    checkApprovalStatus()
  }, [userId, supabase])

  if (loading) {
    return <div className="animate-pulse bg-muted h-12 w-full rounded-md"></div>
  }

  if (isApproved) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Approval Required</AlertTitle>
      <AlertDescription>
        This action requires administrator approval of your instructor account. Please wait for approval or contact an
        administrator.
      </AlertDescription>
    </Alert>
  )
}
