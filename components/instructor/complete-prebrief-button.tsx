"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle, Loader2 } from "lucide-react"

interface CompletePrebriefButtonProps {
  missionId: string
  poaId: string
  canComplete: boolean
  alreadyBriefed: boolean
}

export function CompletePrebriefButton({
  missionId,
  poaId,
  canComplete,
  alreadyBriefed,
}: CompletePrebriefButtonProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleComplete = async () => {
    if (!canComplete) {
      toast({
        title: "Cannot complete pre-brief",
        description: "Student must acknowledge the Plan of Action first.",
        variant: "destructive",
      })
      return
    }

    setIsCompleting(true)
    try {
      const response = await fetch(`/api/instructor/missions/${missionId}/complete-prebrief`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ poaId }),
        credentials: "include",
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to complete pre-brief")
      }

      toast({
        title: "Pre-brief completed!",
        description: "Mission is ready to start.",
      })

      // Redirect to mission detail page
      router.push(`/instructor/missions/${missionId}`)
      router.refresh()
    } catch (error) {
      console.error("Error completing pre-brief:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete pre-brief",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }

  if (alreadyBriefed) {
    return (
      <Button className="w-full" variant="outline" disabled>
        <CheckCircle className="w-4 h-4 mr-2" />
        Pre-Brief Completed
      </Button>
    )
  }

  return (
    <Button
      className="w-full"
      onClick={handleComplete}
      disabled={!canComplete || isCompleting}
    >
      {isCompleting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Completing...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Complete Pre-Brief
        </>
      )}
    </Button>
  )
}

