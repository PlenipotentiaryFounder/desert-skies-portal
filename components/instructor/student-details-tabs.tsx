"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  User, 
  Calendar, 
  BookOpen, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  BarChart3,
  Clock,
  Award,
  Plane,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Eye,
  Download,
  Send,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Star,
  Activity,
  Zap
} from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface StudentDetailsTabsProps {
  studentId: string
  activeEnrollment: any
  instructorId: string
}

interface StudentData {
  // Basic Info
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    date_of_birth?: string
    address?: string
    emergency_contact?: string
    medical_certificate_expiry?: string
    student_pilot_certificate_expiry?: string
  }
  
  // Enrollment & Progress
  enrollment: {
    id: string
    syllabus: {
      title: string
      faa_type: string
      estimated_completion_hours: number
    }
    start_date: string
    target_completion_date?: string
    status: string
    progress_percentage: number
  }
  
  // Flight Data
  flightData: {
    totalHours: number
    soloHours: number
    crossCountryHours: number
    nightHours: number
    instrumentHours: number
    lastFlight?: {
      date: string
      duration: number
      lesson: string
      aircraft: string
    }
    nextFlight?: {
      date: string
      time: string
      lesson: string
      aircraft: string
    }
  }
  
  // ACS Progress
  acsProgress: Array<{
    area: string
    task: string
    proficiency: number
    status: 'not_started' | 'in_progress' | 'completed'
    last_practiced?: string
  }>
  
  // Maneuver Scores
  maneuverScores: Array<{
    maneuver: string
    category: string
    latest_score: number
    average_score: number
    attempts: number
    last_practiced: string
    meets_standard: boolean
  }>
  
  // Billing
  billing: {
    account_balance: number
    available_hours: number
    current_rate: number
    total_billed: number
    last_payment?: string
    next_billing_date?: string
    status: 'active' | 'suspended' | 'overdue'
  }
  
  // Documents
  documents: Array<{
    id: string
    type: string
    name: string
    status: 'valid' | 'expired' | 'expiring_soon'
    expiry_date?: string
    uploaded_date: string
  }>
  
  // Recent Activity
  recentActivity: Array<{
    id: string
    type: 'session' | 'document' | 'payment' | 'endorsement' | 'note'
    title: string
    description: string
    timestamp: string
    status: string
  }>
  
  // Instructor Notes
  instructorNotes: Array<{
    id: string
    content: string
    created_at: string
    type: 'general' | 'concern' | 'achievement' | 'reminder'
  }>
}

export function StudentDetailsTabs({ studentId, activeEnrollment, instructorId }: StudentDetailsTabsProps) {
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchStudentData()
    }
  }, [studentId, instructorId, isClient])

  const fetchStudentData = async () => {
    try {
      setLoading(true)
      console.log('Fetching student data for:', studentId)
      const response = await fetch(`/api/instructor/students/${studentId}/details`, {
        credentials: 'include'
      })
      console.log('API response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Student data received:', data)
        setStudentData(data)
      } else {
        const errorText = await response.text()
        console.error('API error:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error fetching student data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isClient || loading) {
    return <StudentDetailsSkeleton />
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load student data</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="w-full">
        <TabsList className="inline-flex w-full overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-6 md:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="min-w-fit flex-shrink-0 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="progress" className="min-w-fit flex-shrink-0 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="schedule" className="min-w-fit flex-shrink-0 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="billing" className="min-w-fit flex-shrink-0 flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="documents" className="min-w-fit flex-shrink-0 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="communication" className="min-w-fit flex-shrink-0 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Communication
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-6">
        <OverviewTab studentData={studentData} />
      </TabsContent>

      {/* Progress Tab */}
      <TabsContent value="progress" className="space-y-6">
        <ProgressTab studentData={studentData} />
      </TabsContent>

      {/* Schedule Tab */}
      <TabsContent value="schedule" className="space-y-6">
        <ScheduleTab studentData={studentData} studentId={studentId} instructorId={instructorId} />
      </TabsContent>

      {/* Billing Tab */}
      <TabsContent value="billing" className="space-y-6">
        <BillingTab studentData={studentData} studentId={studentId} instructorId={instructorId} />
      </TabsContent>

      {/* Documents Tab */}
      <TabsContent value="documents" className="space-y-6">
        <DocumentsTab studentData={studentData} studentId={studentId} instructorId={instructorId} />
      </TabsContent>

      {/* Communication Tab */}
      <TabsContent value="communication" className="space-y-6">
        <CommunicationTab studentData={studentData} studentId={studentId} instructorId={instructorId} />
      </TabsContent>
    </Tabs>
  )
}

// Overview Tab Component
function OverviewTab({ studentData }: { studentData: StudentData }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Key Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{studentData.flightData.totalHours.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">
            Solo: {studentData.flightData.soloHours.toFixed(1)}h | XC: {studentData.flightData.crossCountryHours.toFixed(1)}h
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Syllabus Progress</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{studentData.enrollment.progress_percentage}%</div>
          <Progress value={studentData.enrollment.progress_percentage} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(studentData.billing.account_balance)}</div>
          <p className="text-xs text-muted-foreground">
            {studentData.billing.available_hours.toFixed(1)} hours available
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {activity.type === 'session' && <Plane className="h-4 w-4 text-blue-500" />}
                  {activity.type === 'document' && <FileText className="h-4 w-4 text-green-500" />}
                  {activity.type === 'payment' && <DollarSign className="h-4 w-4 text-emerald-500" />}
                  {activity.type === 'endorsement' && <Award className="h-4 w-4 text-purple-500" />}
                  {activity.type === 'note' && <MessageSquare className="h-4 w-4 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(activity.timestamp)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Progress Tab Component
function ProgressTab({ studentData }: { studentData: StudentData }) {
  return (
    <div className="space-y-6">
      {/* ACS Standards Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            ACS Standards Progress
          </CardTitle>
          <CardDescription>Student proficiency in Airman Certification Standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.acsProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.area}</p>
                    <p className="text-sm text-muted-foreground">{item.task}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      item.status === 'completed' ? 'default' :
                      item.status === 'in_progress' ? 'secondary' : 'outline'
                    }>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-sm font-medium">{item.proficiency}/5</div>
                  </div>
                </div>
                <Progress value={(item.proficiency / 5) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Maneuver Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Maneuver Performance
          </CardTitle>
          <CardDescription>Latest scores and proficiency trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.maneuverScores.map((maneuver, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{maneuver.maneuver}</p>
                    <Badge variant="outline" className="text-xs">{maneuver.category}</Badge>
                    {maneuver.meets_standard && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Last practiced: {formatDate(maneuver.last_practiced)}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{maneuver.latest_score}/5</div>
                  <div className="text-sm text-muted-foreground">
                    Avg: {maneuver.average_score.toFixed(1)} ({maneuver.attempts} attempts)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Schedule Tab Component
function ScheduleTab({ studentData, studentId, instructorId }: { studentData: StudentData, studentId: string, instructorId: string }) {
  return (
    <div className="space-y-6">
      {/* Quick Schedule Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/instructor/schedule/new?studentId=${studentId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Session
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/instructor/schedule?studentId=${studentId}`}>
                <Eye className="h-4 w-4 mr-2" />
                View All Sessions
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/instructor/schedule/availability`}>
                <Calendar className="h-4 w-4 mr-2" />
                Manage Availability
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Next Flight */}
      {studentData.flightData.nextFlight && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Next Scheduled Flight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">{studentData.flightData.nextFlight.lesson}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(studentData.flightData.nextFlight.date)} at {studentData.flightData.nextFlight.time}
                </p>
                <p className="text-sm text-muted-foreground">
                  Aircraft: {studentData.flightData.nextFlight.aircraft}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Modify
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Flight */}
      {studentData.flightData.lastFlight && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Last Flight Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">{studentData.flightData.lastFlight.lesson}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(studentData.flightData.lastFlight.date)} - {studentData.flightData.lastFlight.duration}h
                </p>
                <p className="text-sm text-muted-foreground">
                  Aircraft: {studentData.flightData.lastFlight.aircraft}
                </p>
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Billing Tab Component
function BillingTab({ studentData, studentId, instructorId }: { studentData: StudentData, studentId: string, instructorId: string }) {
  return (
    <div className="space-y-6">
      {/* Account Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(studentData.billing.account_balance)}</div>
            <p className="text-xs text-muted-foreground">
              {studentData.billing.available_hours.toFixed(1)} hours available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(studentData.billing.current_rate)}/hr</div>
            <p className="text-xs text-muted-foreground">Flight instruction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(studentData.billing.total_billed)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Billing Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/instructor/billing/students/${studentId}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Billing Details
              </Link>
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Update Rates
            </Button>
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={
              studentData.billing.status === 'active' ? 'default' :
              studentData.billing.status === 'suspended' ? 'destructive' : 'secondary'
            }>
              {studentData.billing.status}
            </Badge>
            {studentData.billing.last_payment && (
              <span className="text-sm text-muted-foreground">
                Last payment: {formatDate(studentData.billing.last_payment)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Documents Tab Component
function DocumentsTab({ studentData, studentId, instructorId }: { studentData: StudentData, studentId: string, instructorId: string }) {
  return (
    <div className="space-y-6">
      {/* Document Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valid Documents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {studentData.documents.filter(d => d.status === 'valid').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {studentData.documents.filter(d => d.status === 'expiring_soon').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {studentData.documents.filter(d => d.status === 'expired').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document List */}
      <Card>
        <CardHeader>
          <CardTitle>Student Documents</CardTitle>
          <CardDescription>Manage and track student documents and endorsements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.type} • Uploaded {formatDate(doc.uploaded_date)}
                    </p>
                    {doc.expiry_date && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {formatDate(doc.expiry_date)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    doc.status === 'valid' ? 'default' :
                    doc.status === 'expiring_soon' ? 'secondary' : 'destructive'
                  }>
                    {doc.status.replace('_', ' ')}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/instructor/documents/upload?studentId=${studentId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Link>
            </Button>
            <Button variant="outline">
              <Award className="h-4 w-4 mr-2" />
              Issue Endorsement
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Documents
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Communication Tab Component
function CommunicationTab({ studentData, studentId, instructorId }: { studentData: StudentData, studentId: string, instructorId: string }) {
  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{studentData.student.email}</p>
              </div>
            </div>
            {studentData.student.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{studentData.student.phone}</p>
                </div>
              </div>
            )}
            {studentData.student.address && (
              <div className="flex items-center gap-3 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{studentData.student.address}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructor Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Instructor Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.instructorNotes.map((note) => (
              <div key={note.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{note.type}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(note.created_at)}
                  </span>
                </div>
                <p className="text-sm">{note.content}</p>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Communication Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button variant="outline">
              <Phone className="h-4 w-4 mr-2" />
              Call Student
            </Button>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button variant="outline">
              <Send className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Loading Skeleton
function StudentDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}