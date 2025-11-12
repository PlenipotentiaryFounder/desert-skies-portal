"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Calendar, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  Award, 
  Phone, 
  Mail, 
  MoreHorizontal,
  Plus,
  Edit,
  Eye,
  Send,
  Download,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

interface StudentQuickActionsProps {
  studentId: string
  instructorId: string
  studentName: string
  hasUpcomingSession?: boolean
  hasExpiringDocuments?: boolean
  accountBalance?: number
  lowBalance?: boolean
}

export function StudentQuickActions({
  studentId,
  instructorId,
  studentName,
  hasUpcomingSession = false,
  hasExpiringDocuments = false,
  accountBalance = 0,
  lowBalance = false
}: StudentQuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MoreHorizontal className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>Common tasks for {studentName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {/* Primary Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Scheduling</h4>
            <div className="flex flex-col gap-2">
              <Button asChild className="w-full justify-start">
                <Link href={`/instructor/schedule/new?studentId=${studentId}`}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Flight
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/instructor/schedule?studentId=${studentId}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Schedule
                </Link>
              </Button>
            </div>
          </div>

          {/* Communication */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Communication</h4>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Send Message
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Call Student
              </Button>
            </div>
          </div>

          {/* Documents & Billing */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Documents</h4>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/instructor/documents/upload?studentId=${studentId}`}>
                  <FileText className="h-4 w-4 mr-2" />
                  Upload Document
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Award className="h-4 w-4 mr-2" />
                Issue Endorsement
              </Button>
            </div>
          </div>

          {/* Billing */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Billing</h4>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/instructor/billing/students/${studentId}`}>
                  <DollarSign className="h-4 w-4 mr-2" />
                  View Billing
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </Button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(hasUpcomingSession || hasExpiringDocuments || lowBalance) && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Alerts</h4>
            <div className="space-y-2">
              {hasUpcomingSession && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Calendar className="h-4 w-4" />
                  Upcoming session scheduled
                </div>
              )}
              {hasExpiringDocuments && (
                <div className="flex items-center gap-2 text-sm text-yellow-600">
                  <AlertCircle className="h-4 w-4" />
                  Documents expiring soon
                </div>
              )}
              {lowBalance && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <DollarSign className="h-4 w-4" />
                  Low account balance: {accountBalance}
                </div>
              )}
            </div>
          </div>
        )}

        {/* More Actions Dropdown */}
        <div className="mt-4 pt-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem asChild>
                <Link href={`/instructor/students/${studentId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Student Info
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/instructor/students/${studentId}/reports`}>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/instructor/students/${studentId}/notes`}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Note
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/instructor/students/${studentId}/enrollments`}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Enrollment
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}










