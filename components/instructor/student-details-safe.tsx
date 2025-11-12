"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface StudentDetailsSafeProps {
  studentId: string
  activeEnrollment: any
  instructorId: string
}

interface StudentData {
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone?: string
    bio?: string
    avatar_url?: string
    status: string
  }
  enrollment: {
    id: string
    syllabus_name: string
    syllabus_description: string
    start_date: string
    status: string
    progress_percentage: number
    completed_lessons: number
    total_lessons: number
  }
  flightData: {
    totalHours: number
    soloHours: number
    crossCountryHours: number
    nightHours: number
    lastFlightDate?: string
    lastFlightDuration?: number
    lastFlightAircraft?: string
    lastFlightInstructor?: string
  }
  acsProgress: Array<{
    acs_area: string
    acs_task: string
    proficiency: number
    status: string
    last_scored_date: string
  }>
  maneuverScores: Array<{
    maneuver_name: string
    score: number
    date: string
    instructor_notes?: string
  }>
  billing: {
    account_balance: number
    prepaid_flight_hours: number
    prepaid_ground_hours: number
    available_hours: number
    flight_instruction_rate: number
    ground_instruction_rate: number
    recent_transactions: Array<{
      id: string
      amount: number
      type: string
      date: string
      description: string
    }>
  }
  documents: Array<{
    id: string
    name: string
    type: string
    url: string
    expires_at?: string
    uploaded_at: string
  }>
  communication: Array<{
    id: string
    subject: string
    content: string
    created_at: string
    type: 'general' | 'concern' | 'achievement' | 'reminder'
  }>
}

export function StudentDetailsSafe({ studentId, activeEnrollment, instructorId }: StudentDetailsSafeProps) {
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true)
        console.log('Safe component: Fetching student data for:', studentId)
        const response = await fetch(`/api/instructor/students/${studentId}/details`, {
          credentials: 'include'
        })
        console.log('Safe component: API response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Safe component: Student data received:', data)
          setStudentData(data)
        } else {
          const errorText = await response.text()
          console.error('Safe component: API error:', response.status, errorText)
          setError(`API Error: ${response.status} - ${errorText}`)
        }
      } catch (error) {
        console.error('Safe component: Error fetching student data:', error)
        setError(`Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [studentId, instructorId])

  if (loading) {
    return <StudentDetailsSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-medium">Error Loading Student Data</p>
          <p className="text-muted-foreground mt-2">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!studentData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No student data available.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Simple Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {[
          { id: "overview", label: "Overview", icon: BarChart3 },
          { id: "progress", label: "Progress", icon: TrendingUp },
          { id: "schedule", label: "Schedule", icon: Calendar },
          { id: "billing", label: "Billing", icon: DollarSign },
          { id: "documents", label: "Documents", icon: FileText },
          { id: "communication", label: "Communication", icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab studentData={studentData} />}
      {activeTab === "progress" && <ProgressTab studentData={studentData} />}
      {activeTab === "schedule" && <ScheduleTab studentData={studentData} studentId={studentId} instructorId={instructorId} />}
      {activeTab === "billing" && <BillingTab studentData={studentData} studentId={studentId} instructorId={instructorId} />}
      {activeTab === "documents" && <DocumentsTab studentData={studentData} studentId={studentId} instructorId={instructorId} />}
      {activeTab === "communication" && <CommunicationTab studentData={studentData} studentId={studentId} instructorId={instructorId} />}
    </div>
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
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${studentData.enrollment.progress_percentage}%` }}
            />
          </div>
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
          <CardDescription>Latest flight sessions and important notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.flightData.lastFlightDate && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Last Flight: {formatDate(studentData.flightData.lastFlightDate)}</p>
                  <p className="text-sm text-muted-foreground">
                    {studentData.flightData.lastFlightDuration?.toFixed(1)} hours in {studentData.flightData.lastFlightAircraft} with {studentData.flightData.lastFlightInstructor}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" /> View Session
                </Button>
              </div>
            )}
            {studentData.communication.length > 0 ? (
              studentData.communication.slice(0, 3).map((note) => (
                <div key={note.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{note.subject}</p>
                    <p className="text-sm text-muted-foreground">{note.content.substring(0, 50)}...</p>
                  </div>
                  <Badge variant={note.type === 'concern' ? 'destructive' : 'secondary'}>{note.type}</Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No recent notes.</p>
            )}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            ACS Progress
          </CardTitle>
          <CardDescription>Tracking proficiency against Airman Certification Standards.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {studentData.acsProgress.map((item) => (
              <div key={item.acs_task} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.acs_task}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.status === 'proficient' ? 'default' : 'outline'}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                    <div className="text-sm font-medium">{item.proficiency}/5</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(item.proficiency / 5) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Maneuver Scores
          </CardTitle>
          <CardDescription>Detailed scores for flight maneuvers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {studentData.maneuverScores.map((score) => (
              <div key={score.maneuver_name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{score.maneuver_name}</p>
                  <Badge>{score.score}/5</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{score.instructor_notes}</p>
                <p className="text-xs text-muted-foreground">Last scored: {formatDate(score.date)}</p>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
          <Button size="sm" asChild>
            <Link href={`/instructor/schedule/new?studentId=${studentId}`}>
              <Plus className="h-4 w-4 mr-2" /> Schedule New Flight
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No upcoming sessions found.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Recent Flight Sessions
          </CardTitle>
          <CardDescription>Overview of past flight activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.flightData.lastFlightDate ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Last Flight: {formatDate(studentData.flightData.lastFlightDate)}</p>
                  <p className="text-sm text-muted-foreground">
                    {studentData.flightData.lastFlightDuration?.toFixed(1)} hours in {studentData.flightData.lastFlightAircraft} with {studentData.flightData.lastFlightInstructor}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" /> View Session
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No recent flight sessions.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Billing Tab Component
function BillingTab({ studentData, studentId, instructorId }: { studentData: StudentData, studentId: string, instructorId: string }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Account Summary
          </CardTitle>
          <CardDescription>Current balance and available hours.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(studentData.billing.account_balance)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Available Flight Hours</p>
            <p className="text-2xl font-bold">{studentData.billing.available_hours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-muted-foreground">Flight Instruction Rate</p>
            <p className="text-xl font-bold">{formatCurrency(studentData.billing.flight_instruction_rate)}/hr</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ground Instruction Rate</p>
            <p className="text-xl font-bold">{formatCurrency(studentData.billing.ground_instruction_rate)}/hr</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Latest billing activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.billing.recent_transactions.length > 0 ? (
              studentData.billing.recent_transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                  </div>
                  <p className={`font-bold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No recent transactions.</p>
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Student Documents</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Upload Document
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.documents.length > 0 ? (
              studentData.documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">Type: {doc.type}</p>
                    {doc.expires_at && (
                      <p className="text-xs text-muted-foreground">Expires: {formatDate(doc.expires_at)}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" /> Download
                    </a>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No documents uploaded.</p>
            )}
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
          <Button size="sm" variant="outline">
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <p>{studentData.student.email}</p>
          </div>
          {studentData.student.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <p>{studentData.student.phone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Instructor Notes</CardTitle>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" /> Add Note
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.communication.length > 0 ? (
              studentData.communication.map((note) => (
                <div key={note.id} className="border-b pb-2 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{note.subject}</p>
                    <Badge variant={note.type === 'concern' ? 'destructive' : 'secondary'}>{note.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">Created: {formatDate(note.created_at)}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No instructor notes.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" /> Send Message
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            <Button variant="outline">Send Email</Button>
            <Button variant="outline">Call Student</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Skeleton Loader Component
function StudentDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-20" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[150px] w-full" />
        <Skeleton className="h-[150px] w-full" />
      </div>
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}

