"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  GraduationCap,
  Plane,
  FileText,
  CreditCard,
  TrendingUp,
  MessageSquare,
  Key,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle
} from "lucide-react"
import { AdminStudentData, getStudentDetailedData } from "@/lib/admin-student-service"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

interface StudentDetailsModalProps {
  student: AdminStudentData
  isOpen: boolean
  onClose: () => void
}

export function StudentDetailsModal({ student, isOpen, onClose }: StudentDetailsModalProps) {
  const [detailedData, setDetailedData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (isOpen && student) {
      setLoading(true)
      getStudentDetailedData(student.id)
        .then(data => {
          setDetailedData(data)
          setLoading(false)
        })
        .catch(error => {
          console.error('Error loading detailed data:', error)
          setLoading(false)
        })
    }
  }, [isOpen, student])
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {student.first_name} {student.last_name}
          </DialogTitle>
          <DialogDescription>
            Comprehensive student profile and management
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <StudentDetailsLoading />
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="actions">Quick Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4 mt-4">
              <OverviewTab student={student} detailedData={detailedData} />
            </TabsContent>
            
            <TabsContent value="progress" className="space-y-4 mt-4">
              <ProgressTab student={student} detailedData={detailedData} />
            </TabsContent>
            
            <TabsContent value="billing" className="space-y-4 mt-4">
              <BillingTab student={student} detailedData={detailedData} />
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-4 mt-4">
              <DocumentsTab student={student} detailedData={detailedData} />
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4 mt-4">
              <QuickActionsTab student={student} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

function OverviewTab({ student, detailedData }: { student: AdminStudentData; detailedData: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{student.email}</p>
            </div>
          </div>
          
          {student.phone_number && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">{student.phone_number}</p>
              </div>
            </div>
          )}
          
          {student.address_line1 && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {student.address_line1}<br />
                  {student.city}, {student.state}
                </p>
              </div>
            </div>
          )}
          
          {student.date_of_birth && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date of Birth</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(student.date_of_birth).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Enrollment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Current Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.enrollments.length > 0 ? (
            <div className="space-y-4">
              {student.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium capitalize">
                      {enrollment.syllabus?.category || 'Unknown Program'}
                    </p>
                    <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                      {enrollment.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {enrollment.syllabus?.title}
                  </p>
                  {enrollment.instructor && (
                    <p className="text-sm text-muted-foreground">
                      Instructor: {enrollment.instructor.first_name} {enrollment.instructor.last_name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Started: {new Date(enrollment.start_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active enrollments</p>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Quick Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-aviation-sky-600">
                {student.progress.total_flight_hours.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Flight Hours</p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-aviation-sky-600">
                {student.progress.total_missions}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total Missions</p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-aviation-sky-600">
                {student.progress.acs_completion}%
              </div>
              <p className="text-sm text-muted-foreground mt-1">ACS Progress</p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className={`text-2xl font-bold ${student.billing.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(student.billing.current_balance).toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {student.billing.current_balance >= 0 ? 'Account Credit' : 'Balance Owed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Recent Missions</CardTitle>
        </CardHeader>
        <CardContent>
          {detailedData?.missions && detailedData.missions.length > 0 ? (
            <div className="space-y-3">
              {detailedData.missions.slice(0, 5).map((mission: any) => (
                <div key={mission.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{mission.mission_code || 'Mission'}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(mission.scheduled_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={mission.status === 'completed' ? 'default' : 'secondary'}>
                    {mission.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent missions</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ProgressTab({ student, detailedData }: { student: AdminStudentData; detailedData: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>ACS Standards Progress</CardTitle>
          <CardDescription>
            Proficiency in Airman Certification Standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Completion</span>
                <span className="font-medium">{student.progress.acs_completion}%</span>
              </div>
              <Progress value={student.progress.acs_completion} className="h-3" />
            </div>
            
            {detailedData?.acsProgress && detailedData.acsProgress.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="font-medium">Recent Evaluations</h4>
                {detailedData.acsProgress.slice(0, 10).map((progress: any) => (
                  <div key={progress.id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {progress.acs_task?.task_code}: {progress.acs_task?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {progress.acs_task?.acs_area?.area_code} - {progress.acs_task?.acs_area?.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(progress.proficiency_level / 5) * 100} className="w-20 h-2" />
                      <span className="text-sm font-medium w-12 text-right">
                        {progress.proficiency_level}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Flight Hours Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Flight Time</p>
              <p className="text-2xl font-bold">{student.progress.total_flight_hours.toFixed(1)} hrs</p>
            </div>
            {/* Add more hour breakdowns here if available in logbook data */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BillingTab({ student, detailedData }: { student: AdminStudentData; detailedData: any }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className={`text-2xl font-bold ${student.billing.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(student.billing.current_balance).toFixed(2)}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Total Invoiced</p>
              <p className="text-2xl font-bold">${student.billing.total_invoiced.toFixed(2)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-green-600">${student.billing.total_paid.toFixed(2)}</p>
            </div>
          </div>
          
          {student.billing.last_payment_date && (
            <p className="text-sm text-muted-foreground">
              Last payment: {new Date(student.billing.last_payment_date).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {detailedData?.invoices && detailedData.invoices.length > 0 ? (
            <div className="space-y-3">
              {detailedData.invoices.map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${invoice.total_amount?.toFixed(2) || '0.00'}</p>
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices found</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DocumentsTab({ student, detailedData }: { student: AdminStudentData; detailedData: any }) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'expiring':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'expired':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'missing':
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              {getStatusIcon(student.documents.medical_certificate_status)}
              <div>
                <p className="font-medium">Medical Certificate</p>
                {student.documents.medical_expiration && (
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(student.documents.medical_expiration).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Badge variant={student.documents.medical_certificate_status === 'valid' ? 'default' : 'secondary'}>
              {student.documents.medical_certificate_status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              {getStatusIcon(student.documents.student_pilot_certificate_status)}
              <div>
                <p className="font-medium">Student Pilot Certificate</p>
              </div>
            </div>
            <Badge variant={student.documents.student_pilot_certificate_status === 'valid' ? 'default' : 'secondary'}>
              {student.documents.student_pilot_certificate_status}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {getStatusIcon(student.documents.government_id_status)}
              <div>
                <p className="font-medium">Government ID</p>
              </div>
            </div>
            <Badge variant={student.documents.government_id_status === 'valid' ? 'default' : 'secondary'}>
              {student.documents.government_id_status}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {detailedData?.documents && detailedData.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {detailedData.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{doc.document_type?.name || 'Document'}</p>
                    {doc.expiration_date && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(doc.expiration_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function QuickActionsTab({ student }: { student: AdminStudentData }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Student Management</CardTitle>
          <CardDescription>Common administrative actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => window.location.href = `/admin/users/${student.id}`}
          >
            <User className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => {
              // TODO: Implement password reset
              alert('Password reset functionality coming soon')
            }}
          >
            <Key className="h-4 w-4 mr-2" />
            Reset Password
          </Button>
          
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => window.location.href = `/admin/billing`}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Manage Billing
          </Button>
          
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => {
              // TODO: Implement message sending
              alert('Messaging functionality coming soon')
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>View Details</CardTitle>
          <CardDescription>Navigate to detailed views</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => window.location.href = `/student/progress?studentId=${student.id}`}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Full Progress Report
          </Button>
          
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => window.location.href = `/student/logbook?studentId=${student.id}`}
          >
            <Plane className="h-4 w-4 mr-2" />
            View Logbook
          </Button>
          
          <Button 
            className="w-full justify-start" 
            variant="outline"
            onClick={() => window.location.href = `/student/documents?studentId=${student.id}`}
          >
            <FileText className="h-4 w-4 mr-2" />
            View All Documents
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentDetailsLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

