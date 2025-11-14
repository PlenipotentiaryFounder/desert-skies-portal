"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  XCircle, 
  Clock,
  Mail,
  User,
  GraduationCap,
  Calendar,
  UserCog,
  ChevronRight,
  Award
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface EnrollmentCardProps {
  enrollment: any
  type: 'pending' | 'active' | 'graduated'
  onApprove?: () => void
}

export function EnrollmentCard({ enrollment, type, onApprove }: EnrollmentCardProps) {
  const student = enrollment.student
  const instructor = enrollment.instructor
  const syllabus = enrollment.syllabus

  const getStatusBadge = () => {
    switch (type) {
      case 'pending':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        )
      case 'active':
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'graduated':
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
            <Award className="w-3 h-3 mr-1" />
            Graduated
          </Badge>
        )
    }
  }

  return (
    <div className="p-4 hover:bg-muted/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Student info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">
                  {student?.first_name} {student?.last_name}
                </h4>
                {getStatusBadge()}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {student?.email}
                </span>
              </div>
            </div>
          </div>

          {/* Program and Instructor Info - Compact Row */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block mb-0.5">Program</span>
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-3 h-3 text-primary" />
                <span className="font-medium">
                  {syllabus?.code || syllabus?.target_certificate || syllabus?.faa_type || 'N/A'}
                </span>
              </div>
              <span className="text-muted-foreground text-[10px]">{syllabus?.title}</span>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">Instructor</span>
              <div className="flex items-center gap-1.5">
                <UserCog className="w-3 h-3 text-primary" />
                <span className="font-medium">
                  {instructor?.first_name} {instructor?.last_name}
                </span>
              </div>
            </div>

            <div>
              <span className="text-muted-foreground block mb-0.5">
                {type === 'graduated' ? 'Completed' : type === 'pending' ? 'Requested' : 'Started'}
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-primary" />
                <span className="font-medium">
                  {type === 'graduated' && enrollment.completion_date
                    ? formatDate(enrollment.completion_date)
                    : type === 'pending'
                    ? formatDate(enrollment.created_at)
                    : formatDate(enrollment.start_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Approval info for active/graduated */}
          {(type === 'active' || type === 'graduated') && enrollment.approved_at && (
            <div className="text-[10px] text-muted-foreground pt-1 border-t">
              Approved by {enrollment.approved_by_profile?.first_name} {enrollment.approved_by_profile?.last_name} on {formatDate(enrollment.approved_at)}
            </div>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {type === 'pending' && onApprove && (
            <Button 
              size="sm" 
              onClick={onApprove}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Review & Approve
            </Button>
          )}
          
          <Link href={`/admin/enrollments/${enrollment.id}`}>
            <Button variant="outline" size="sm">
              View Details
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

