"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  User,
  FileText,
  UserCog,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronLeft,
  Award,
  Plane,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  AlertCircle,
  Clock
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

interface EnrollmentApprovalDialogProps {
  enrollment: any
  onboardingData: any
  documentData: any[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ApprovalStep = 'overview' | 'documents' | 'instructor' | 'syllabus' | 'review'

export function EnrollmentApprovalDialog({
  enrollment,
  onboardingData,
  documentData,
  open,
  onOpenChange,
}: EnrollmentApprovalDialogProps) {
  const [currentStep, setCurrentStep] = useState<ApprovalStep>('overview')
  const [approvalNotes, setApprovalNotes] = useState('')
  const [selectedInstructor, setSelectedInstructor] = useState(enrollment?.instructor?.id || '')
  const [selectedSyllabus, setSelectedSyllabus] = useState(enrollment?.syllabus?.id || '')
  const [documentApprovals, setDocumentApprovals] = useState<Record<string, boolean>>({})
  const [instructors, setInstructors] = useState<any[]>([])
  const [syllabi, setSyllabi] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Load instructors and syllabi
  useEffect(() => {
    const loadData = async () => {
      if (!open) return
      
      // Load instructors - get all users with instructor role
      const { data: instructorRoles } = await supabase
        .from('user_roles')
        .select('user_id, roles!inner(name)')
        .eq('roles.name', 'instructor')
      
      if (instructorRoles && instructorRoles.length > 0) {
        const instructorIds = instructorRoles.map(r => r.user_id)
        const { data: instructorData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', instructorIds)
          .order('first_name')
        
        if (instructorData) setInstructors(instructorData)
      }
      
      // Load syllabi
      const { data: syllabiData } = await supabase
        .from('syllabi')
        .select('id, title, faa_type, target_certificate, code')
        .eq('is_active', true)
        .order('title')
      
      if (syllabiData) setSyllabi(syllabiData)
    }
    
    loadData()
  }, [open, supabase])

  const steps: { id: ApprovalStep; title: string; icon: any }[] = [
    { id: 'overview', title: 'Student Overview', icon: User },
    { id: 'documents', title: 'Document Verification', icon: FileText },
    { id: 'instructor', title: 'Assign Instructor', icon: UserCog },
    { id: 'syllabus', title: 'Confirm Program', icon: GraduationCap },
    { id: 'review', title: 'Final Review', icon: CheckCircle2 },
  ]

  const currentStepIndex = steps.findIndex(s => s.id === currentStep)
  const canGoNext = currentStepIndex < steps.length - 1
  const canGoBack = currentStepIndex > 0

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStep(steps[currentStepIndex + 1].id)
    }
  }

  const handleBack = () => {
    if (canGoBack) {
      setCurrentStep(steps[currentStepIndex - 1].id)
    }
  }

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const response = await fetch('/api/admin/enrollments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          instructorId: selectedInstructor,
          syllabusId: selectedSyllabus,
          approvalNotes,
          approvedBy: user?.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to approve enrollment')

      toast({
        title: "Enrollment Approved",
        description: `${enrollment.student?.first_name} ${enrollment.student?.last_name} has been approved for enrollment.`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error approving enrollment:', error)
      toast({
        title: "Error",
        description: "Failed to approve enrollment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!approvalNotes.trim()) {
      toast({
        title: "Notes Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const response = await fetch('/api/admin/enrollments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: enrollment.id,
          rejectionNotes: approvalNotes,
          rejectedBy: user?.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to reject enrollment')

      toast({
        title: "Enrollment Rejected",
        description: "The enrollment request has been rejected.",
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error('Error rejecting enrollment:', error)
      toast({
        title: "Error",
        description: "Failed to reject enrollment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enrollment Approval Workflow</DialogTitle>
          <DialogDescription>
            Review and approve enrollment for {enrollment?.student?.first_name} {enrollment?.student?.last_name}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isActive = step.id === currentStep
            const isComplete = index < currentStepIndex

            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isComplete
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted bg-muted text-muted-foreground'
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs mt-1 text-center max-w-[80px] ${isActive ? 'font-medium' : ''}`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 w-12 mx-2 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 'overview' && (
            <StudentOverview enrollment={enrollment} onboardingData={onboardingData} />
          )}
          {currentStep === 'documents' && (
            <DocumentVerification
              documentData={documentData}
              onboardingData={onboardingData}
              documentApprovals={documentApprovals}
              setDocumentApprovals={setDocumentApprovals}
            />
          )}
          {currentStep === 'instructor' && (
            <InstructorAssignment
              instructors={instructors}
              selectedInstructor={selectedInstructor}
              setSelectedInstructor={setSelectedInstructor}
            />
          )}
          {currentStep === 'syllabus' && (
            <SyllabusConfirmation
              syllabi={syllabi}
              selectedSyllabus={selectedSyllabus}
              setSelectedSyllabus={setSelectedSyllabus}
              enrollment={enrollment}
            />
          )}
          {currentStep === 'review' && (
            <FinalReview
              enrollment={enrollment}
              selectedInstructor={instructors.find(i => i.id === selectedInstructor)}
              selectedSyllabus={syllabi.find(s => s.id === selectedSyllabus)}
              approvalNotes={approvalNotes}
              setApprovalNotes={setApprovalNotes}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={!canGoBack || isSubmitting}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="flex gap-2">
            {currentStep === 'review' && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isSubmitting || !selectedInstructor || !selectedSyllabus}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Approve Enrollment
                </Button>
              </>
            )}
            {currentStep !== 'review' && (
              <Button onClick={handleNext} disabled={!canGoNext || isSubmitting}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Step Components
function StudentOverview({ enrollment, onboardingData }: any) {
  const student = enrollment?.student

  return (
    <Card>
      <CardContent className="p-4 space-y-4 text-sm">
        {/* Student Information */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <User className="w-3 h-3" />
            STUDENT INFORMATION
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Name</span>
              <span className="font-medium">{student?.first_name} {student?.last_name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Email</span>
              <span className="font-medium">{student?.email}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Phone</span>
              <span className="font-medium">{onboardingData?.phone_number || 'Not provided'}</span>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <Plane className="w-3 h-3" />
            FLIGHT EXPERIENCE
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Certificate</span>
              <span className="font-medium">
                {onboardingData?.has_pilot_certificate ? (
                  <span className="text-green-600">✓ Yes</span>
                ) : (
                  <span className="text-muted-foreground">✗ No</span>
                )}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Experience</span>
              <span className="font-medium capitalize">
                {onboardingData?.flight_experience || 'Not specified'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Desired Program</span>
              <span className="font-medium capitalize">
                {onboardingData?.desired_program?.replace(/_/g, ' ') || 'Not specified'}
              </span>
            </div>
          </div>
          {onboardingData?.training_goals && (
            <div className="mt-2">
              <span className="text-muted-foreground block text-xs">Training Goals</span>
              <p className="text-xs mt-1">{onboardingData.training_goals}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2">
            <FileCheck className="w-3 h-3" />
            MEDICAL & TSA
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Medical Class</span>
              <span className="font-medium">{onboardingData?.medical_certificate_class || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">TSA Citizenship</span>
              <span className="font-medium">{onboardingData?.tsa_citizenship_status || 'Not specified'}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DocumentVerification({ documentData, onboardingData, documentApprovals, setDocumentApprovals }: any) {
  const supabase = createClient()
  const [documents, setDocuments] = useState(documentData || [])
  const [loading, setLoading] = useState(false)
  
  // Reload documents on mount to ensure we have latest data
  useEffect(() => {
    const loadDocuments = async () => {
      if (!onboardingData?.user_id) return
      
      setLoading(true)
      const { data, error } = await supabase
        .from('document_uploads')
        .select('*')
        .eq('student_id', onboardingData.user_id)
      
      if (!error && data) {
        setDocuments(data)
      }
      setLoading(false)
    }
    
    loadDocuments()
  }, [onboardingData?.user_id, supabase])
  
  const requiredDocuments = [
    { type: 'government_id', label: 'Government ID', icon: FileText },
    { type: 'birth_certificate', label: 'Birth Certificate / Passport', icon: FileText },
    { type: 'medical_certificate', label: 'Medical Certificate', icon: FileCheck },
  ]

  if (onboardingData?.has_pilot_certificate) {
    requiredDocuments.push({ type: 'pilot_certificate', label: 'Pilot Certificate', icon: Award })
  }

  const getDocumentStatus = (type: string) => {
    const doc = documents?.find((d: any) => d.document_type === type)
    return doc ? 'uploaded' : 'missing'
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-blue-900 mb-1">Document Verification</p>
          <p className="text-blue-700">
            Review all required documents. Click "Approve" for each document after verification.
          </p>
        </div>
      </div>

      {requiredDocuments.map((doc) => {
        const DocIcon = doc.icon
        const status = getDocumentStatus(doc.type)
        const document = documents?.find((d: any) => d.document_type === doc.type)
        const isApproved = documentApprovals[doc.type]

        return (
          <Card key={doc.type} className={isApproved ? 'border-green-500' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <DocIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{doc.label}</h4>
                    {status === 'uploaded' && document ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="border-green-500 text-green-700">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                          <span>{new Date(document.created_at).toLocaleDateString()}</span>
                        </div>
                        {document.file_url && (
                          <a
                            href={document.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            View Document
                          </a>
                        )}
                      </div>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Not Uploaded
                      </Badge>
                    )}
                  </div>
                </div>
                
                {status === 'uploaded' && (
                  <Button
                    size="sm"
                    variant={isApproved ? "outline" : "default"}
                    className={isApproved ? "border-green-500 text-green-700" : ""}
                    onClick={() => setDocumentApprovals((prev: any) => ({
                      ...prev,
                      [doc.type]: !prev[doc.type]
                    }))}
                  >
                    {isApproved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Approved
                      </>
                    ) : (
                      'Approve'
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function InstructorAssignment({ instructors, selectedInstructor, setSelectedInstructor }: any) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="w-4 h-4" />
            Assign Flight Instructor
          </CardTitle>
          <DialogDescription>
            Select the primary flight instructor for this student
          </DialogDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="instructor-select">Flight Instructor</Label>
          <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
            <SelectTrigger id="instructor-select" className="mt-2">
              <SelectValue placeholder="Select an instructor" />
            </SelectTrigger>
            <SelectContent>
              {instructors.map((instructor: any) => (
                <SelectItem key={instructor.id} value={instructor.id}>
                  {instructor.first_name} {instructor.last_name} ({instructor.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}

function SyllabusConfirmation({ syllabi, selectedSyllabus, setSelectedSyllabus, enrollment }: any) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Confirm Training Program
          </CardTitle>
          <DialogDescription>
            Verify or change the training program syllabus
          </DialogDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="syllabus-select">Training Program</Label>
          <Select value={selectedSyllabus} onValueChange={setSelectedSyllabus}>
            <SelectTrigger id="syllabus-select" className="mt-2">
              <SelectValue placeholder="Select a program" />
            </SelectTrigger>
            <SelectContent>
              {syllabi.map((syllabus: any) => {
                const category = syllabus.code || syllabus.target_certificate || syllabus.faa_type
                return (
                  <SelectItem key={syllabus.id} value={syllabus.id}>
                    {category} - {syllabus.title}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}

function FinalReview({ enrollment, selectedInstructor, selectedSyllabus, approvalNotes, setApprovalNotes }: any) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Final Review
          </CardTitle>
          <DialogDescription>
            Review all details before approving the enrollment
          </DialogDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <span className="text-muted-foreground">Student</span>
            <p className="font-medium">
              {enrollment?.student?.first_name} {enrollment?.student?.last_name}
            </p>
          </div>

          <div>
            <span className="text-muted-foreground">Instructor</span>
            <p className="font-medium">
              {selectedInstructor?.first_name} {selectedInstructor?.last_name}
            </p>
          </div>

          <div>
            <span className="text-muted-foreground">Training Program</span>
            <p className="font-medium">
              {selectedSyllabus?.code || selectedSyllabus?.target_certificate || selectedSyllabus?.faa_type} - {selectedSyllabus?.title}
            </p>
          </div>

          <div>
            <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
            <Textarea
              id="approval-notes"
              placeholder="Add any notes about this approval..."
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-green-900 mb-1">Ready to Approve</p>
          <p className="text-green-700">
            Click "Approve Enrollment" to activate this student's training program.
          </p>
        </div>
      </div>
    </div>
  )
}

