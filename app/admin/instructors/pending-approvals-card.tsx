"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, XCircle, Eye } from "lucide-react"
import { AdminInstructorData, approveInstructor, rejectInstructor } from "@/lib/admin-instructor-service"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface PendingApprovalsCardProps {
  count: number
  instructors: AdminInstructorData[]
}

export function PendingApprovalsCard({ count, instructors }: PendingApprovalsCardProps) {
  const [processing, setProcessing] = useState<string[]>([])
  const [localInstructors, setLocalInstructors] = useState(instructors)
  const { toast } = useToast()
  const router = useRouter()

  const handleApprove = async (instructor: AdminInstructorData) => {
    setProcessing(prev => [...prev, instructor.id])
    
    try {
      // Get current user ID from session (you'll need to pass this or get it)
      const adminId = 'current-admin-id' // TODO: Get from session
      
      await approveInstructor(instructor.id, adminId)
      
      setLocalInstructors(prev => prev.filter(i => i.id !== instructor.id))
      
      toast({
        title: "Instructor Approved",
        description: `${instructor.first_name} ${instructor.last_name} has been approved as an instructor.`,
      })
      
      router.refresh()
    } catch (error) {
      console.error('Error approving instructor:', error)
      toast({
        title: "Error",
        description: "Failed to approve instructor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(prev => prev.filter(id => id !== instructor.id))
    }
  }

  const handleReject = async (instructor: AdminInstructorData) => {
    setProcessing(prev => [...prev, instructor.id])
    
    try {
      await rejectInstructor(instructor.id)
      
      setLocalInstructors(prev => prev.filter(i => i.id !== instructor.id))
      
      toast({
        title: "Instructor Rejected",
        description: `${instructor.first_name} ${instructor.last_name}'s application has been rejected.`,
      })
      
      router.refresh()
    } catch (error) {
      console.error('Error rejecting instructor:', error)
      toast({
        title: "Error",
        description: "Failed to reject instructor. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(prev => prev.filter(id => id !== instructor.id))
    }
  }

  if (localInstructors.length === 0) {
    return null
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <div>
            <CardTitle className="text-yellow-900">Pending Instructor Approvals</CardTitle>
            <CardDescription className="text-yellow-700">
              {localInstructors.length} instructor{localInstructors.length !== 1 ? 's' : ''} awaiting approval
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {localInstructors.slice(0, 3).map((instructor) => (
            <div key={instructor.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {instructor.first_name?.[0]}{instructor.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {instructor.first_name} {instructor.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">{instructor.email}</div>
                  <div className="flex gap-1 mt-1">
                    {instructor.certifications.cfi && <Badge key={`${instructor.id}-cfi`} variant="secondary" className="text-xs">CFI</Badge>}
                    {instructor.certifications.cfii && <Badge key={`${instructor.id}-cfii`} variant="secondary" className="text-xs">CFII</Badge>}
                    {instructor.certifications.mei && <Badge key={`${instructor.id}-mei`} variant="secondary" className="text-xs">MEI</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReject(instructor)}
                  disabled={processing.includes(instructor.id)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(instructor)}
                  disabled={processing.includes(instructor.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
          {localInstructors.length > 3 && (
            <Button variant="outline" className="w-full">
              View All {localInstructors.length} Pending Approvals
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

