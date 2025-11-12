"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"
import { acknowledgePlanOfAction } from "@/lib/plan-of-action-service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AcknowledgePOAButtonProps {
  poaId: string
  missionId: string
  fullWidth?: boolean
}

export function AcknowledgePOAButton({ poaId, missionId, fullWidth = false }: AcknowledgePOAButtonProps) {
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const router = useRouter()

  const handleAcknowledge = async () => {
    setIsAcknowledging(true)
    try {
      const result = await acknowledgePlanOfAction(poaId)
      
      if (result.success) {
        toast.success("Plan of Action acknowledged", {
          description: "Your instructor will be notified that you've reviewed the POA."
        })
        router.refresh()
      } else {
        toast.error("Failed to acknowledge", {
          description: result.error || "Please try again."
        })
      }
    } catch (error) {
      toast.error("An error occurred", {
        description: "Please try again later."
      })
    } finally {
      setIsAcknowledging(false)
    }
  }

  return (
    <Button 
      onClick={handleAcknowledge} 
      disabled={isAcknowledging}
      className={fullWidth ? "w-full" : ""}
    >
      {isAcknowledging ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Acknowledging...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          I've Reviewed This POA
        </>
      )}
    </Button>
  )
}

