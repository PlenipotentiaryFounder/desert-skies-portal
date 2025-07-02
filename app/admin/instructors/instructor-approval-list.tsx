"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate } from "@/lib/utils"
import { CheckCircle, XCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface Instructor {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
  created_at: string
  status: string
}

interface InstructorApprovalListProps {
  initialInstructors: Instructor[]
}

export async function InstructorApprovalList({ initialInstructors }: InstructorApprovalListProps) {
  const [instructors, setInstructors] = useState<Instructor[]>(initialInstructors)
  const [processingIds, setProcessingIds] = useState<string[]>([])
  const supabase = await createClient()

  const handleApprove = async (instructor: Instructor) => {
    setProcessingIds((prev) => [...prev, instructor.id])
    try {
      // Update instructor status to active
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", instructor.id)

      if (error) throw error

      // Create notification for the instructor
      await supabase.from("notifications").insert({
        type: "account_approved",
        title: "Account Approved",
        message: "Your instructor account has been approved. You now have full access to all instructor features.",
        user_id: instructor.id,
        is_read: false,
        created_at: new Date().toISOString(),
      })

      // Update local state
      setInstructors((prev) => prev.filter((i) => i.id !== instructor.id))

      toast({
        title: "Instructor approved",
        description: `${instructor.first_name} ${instructor.last_name} has been approved as an instructor.`,
      })
    } catch (error) {
      console.error("Error approving instructor:", error)
      toast({
        title: "Error",
        description: "Failed to approve instructor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== instructor.id))
    }
  }

  const handleReject = async (instructor: Instructor) => {
    setProcessingIds((prev) => [...prev, instructor.id])
    try {
      // Update instructor status to rejected
      const { error } = await supabase
        .from("profiles")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("id", instructor.id)

      if (error) throw error

      // Create notification for the instructor
      await supabase.from("notifications").insert({
        type: "account_rejected",
        title: "Account Not Approved",
        message:
          "Your instructor account application was not approved. Please contact an administrator for more information.",
        user_id: instructor.id,
        is_read: false,
        created_at: new Date().toISOString(),
      })

      // Update local state
      setInstructors((prev) => prev.filter((i) => i.id !== instructor.id))

      toast({
        title: "Instructor rejected",
        description: `${instructor.first_name} ${instructor.last_name}'s instructor application has been rejected.`,
      })
    } catch (error) {
      console.error("Error rejecting instructor:", error)
      toast({
        title: "Error",
        description: "Failed to reject instructor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingIds((prev) => prev.filter((id) => id !== instructor.id))
    }
  }

  if (instructors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <p className="text-muted-foreground">No pending instructor approvals</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {instructors.map((instructor) => (
        <Card key={instructor.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage
                    src={instructor.avatar_url || undefined}
                    alt={`${instructor.first_name} ${instructor.last_name}`}
                  />
                  <AvatarFallback>
                    {instructor.first_name[0]}
                    {instructor.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>
                    {instructor.first_name} {instructor.last_name}
                  </CardTitle>
                  <CardDescription>{instructor.email}</CardDescription>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">Registered on {formatDate(instructor.created_at)}</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => handleReject(instructor)}
                disabled={processingIds.includes(instructor.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={() => handleApprove(instructor)} disabled={processingIds.includes(instructor.id)}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
