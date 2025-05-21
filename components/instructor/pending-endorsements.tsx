"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { CheckCircle, XCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { WithApprovalCheck } from "@/components/instructor/with-approval-check"
import { useState } from "react"

interface Endorsement {
  id: string
  created_at: string
  type: string
  status: string
  student_id: string
  students?: {
    first_name: string
    last_name: string
  }
}

interface PendingEndorsementsProps {
  endorsements: Endorsement[]
  instructorStatus: string | null
  instructorId: string
}

const supabase = createClient()

export function PendingEndorsements({ endorsements, instructorStatus, instructorId }: PendingEndorsementsProps) {
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const [localEndorsements, setLocalEndorsements] = useState(endorsements)

  const handleApprove = async (id: string) => {
    if (instructorStatus !== "active") {
      toast({
        title: "Action not allowed",
        description: "Your instructor account needs to be approved before you can perform this action.",
        variant: "destructive",
      })
      return
    }
    setProcessingIds((prev) => [...prev, id])
    try {
      const { error } = await supabase
        .from("endorsements")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
      setLocalEndorsements((prev) => prev.filter((endorsement) => endorsement.id !== id))
      toast({ title: "Endorsement approved", description: "The endorsement has been successfully approved." })
    } catch (error) {
      console.error("Error approving endorsement:", error)
      toast({ title: "Error", description: "Failed to approve the endorsement. Please try again.", variant: "destructive" })
    } finally {
      setProcessingIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleReject = async (id: string) => {
    if (instructorStatus !== "active") {
      toast({
        title: "Action not allowed",
        description: "Your instructor account needs to be approved before you can perform this action.",
        variant: "destructive",
      })
      return
    }
    setProcessingIds((prev) => [...prev, id])
    try {
      const { error } = await supabase
        .from("endorsements")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("id", id)
      if (error) throw error
      setLocalEndorsements((prev) => prev.filter((endorsement) => endorsement.id !== id))
      toast({ title: "Endorsement rejected", description: "The endorsement has been rejected." })
    } catch (error) {
      console.error("Error rejecting endorsement:", error)
      toast({ title: "Error", description: "Failed to reject the endorsement. Please try again.", variant: "destructive" })
    } finally {
      setProcessingIds((prev) => prev.filter((item) => item !== id))
    }
  }

  if (!localEndorsements || localEndorsements.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-muted-foreground">No pending endorsements</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {localEndorsements.map((endorsement) => (
        <div key={endorsement.id} className="border rounded-md p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{endorsement.type}</h3>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Pending</span>
            </div>
            <p className="text-sm">
              <span className="font-medium">Student: </span>
              {endorsement.students
                ? `${endorsement.students.first_name} ${endorsement.students.last_name}`
                : "Unknown Student"}
            </p>
            <p className="text-xs text-muted-foreground">Requested on {formatDate(endorsement.created_at)}</p>
            <WithApprovalCheck
              userId={instructorId}
              fallback={
                <div className="flex justify-center mt-2">
                  <Button variant="outline" size="sm" disabled>
                    Approval required to take action
                  </Button>
                </div>
              }
            >
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleApprove(endorsement.id)}
                  disabled={processingIds.includes(endorsement.id)}
                >
                  <CheckCircle className="mr-1 h-4 w-4" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleReject(endorsement.id)}
                  disabled={processingIds.includes(endorsement.id)}
                >
                  <XCircle className="mr-1 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </WithApprovalCheck>
          </div>
        </div>
      ))}
      <div className="flex justify-center mt-4">
        <Button asChild variant="outline">
          <Link href="/instructor/endorsements">View All Endorsements</Link>
        </Button>
      </div>
    </div>
  )
}
