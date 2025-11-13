'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  FileText,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface PendingEnrollmentApprovalCardProps {
  enrollment: any
}

export function PendingEnrollmentApprovalCard({ enrollment }: PendingEnrollmentApprovalCardProps) {
  const router = useRouter()
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [notes, setNotes] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await fetch('/api/admin/enrollments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollment.id,
          notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to approve enrollment')
      }

      toast.success('Enrollment approved successfully')
      router.refresh()
    } catch (error) {
      console.error('Error approving enrollment:', error)
      toast.error('Failed to approve enrollment')
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (!notes.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch('/api/admin/enrollments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollment.id,
          notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to reject enrollment')
      }

      toast.success('Enrollment rejected')
      router.refresh()
    } catch (error) {
      console.error('Error rejecting enrollment:', error)
      toast.error('Failed to reject enrollment')
    } finally {
      setIsRejecting(false)
    }
  }

  const onboarding = enrollment.onboarding?.[0]
  const student = enrollment.student
  const instructor = enrollment.instructor
  const syllabus = enrollment.syllabus

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>
                {student?.first_name} {student?.last_name}
              </CardTitle>
              <CardDescription>
                Enrolled {new Date(enrollment.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending Approval
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${student?.email}`} className="text-blue-600 hover:underline">
                  {student?.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{student?.phone_number || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Joined {new Date(student?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Training Information
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Program:</span>{' '}
                {onboarding?.desired_program || 'Not specified'}
              </div>
              <div>
                <span className="font-medium">Certificate Level:</span>{' '}
                {onboarding?.pilot_certificate_type || 'Not specified'}
              </div>
              <div>
                <span className="font-medium">Medical Class:</span>{' '}
                {onboarding?.medical_certificate_class || 'Not specified'}
              </div>
              <div>
                <span className="font-medium">TSA Status:</span>{' '}
                {onboarding?.tsa_citizenship_status || 'Not specified'}
              </div>
            </div>
          </div>
        </div>

        {/* Enrollment Details */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-3">Enrollment Details</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Assigned Instructor:</span>{' '}
              {instructor ? `${instructor.first_name} ${instructor.last_name}` : 'Not assigned'}
            </div>
            <div>
              <span className="font-medium">Selected Syllabus:</span>{' '}
              {syllabus?.name || 'Not selected'}
            </div>
            <div>
              <span className="font-medium">Start Date:</span>{' '}
              {new Date(enrollment.start_date).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Onboarding Completed:</span>{' '}
              {onboarding?.completed_at
                ? new Date(onboarding.completed_at).toLocaleDateString()
                : 'In progress'}
            </div>
          </div>
        </div>

        {/* Documents */}
        {onboarding?.uploaded_documents && Object.keys(onboarding.uploaded_documents).length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Uploaded Documents
            </h4>
            <div className="grid md:grid-cols-3 gap-2">
              {Object.entries(onboarding.uploaded_documents).map(([key, value]: [string, any]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => value && window.open(value.url || value, '_blank')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action Items */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Review Checklist:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Verify student identification documents</li>
              <li>Confirm medical certificate is valid and current</li>
              <li>Review pilot certificate (if applicable)</li>
              <li>Verify instructor assignment is appropriate</li>
              <li>Confirm syllabus selection matches student goals</li>
              <li>Ensure TSA requirements are met (if applicable)</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Admin Notes {showRejectForm && <span className="text-destructive">*</span>}
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              showRejectForm
                ? 'Please provide a reason for rejection...'
                : 'Add any notes about this enrollment (optional)'
            }
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!showRejectForm ? (
            <>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="flex-1"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Enrollment
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Enrollment
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false)
                  setNotes('')
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || !notes.trim()}
                className="flex-1"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Rejection
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {enrollment.notes && (
          <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-sm mb-2">Enrollment Notes:</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{enrollment.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

