"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  User, 
  Calendar, 
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
  MapPin
} from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface StudentDetailsSimpleProps {
  studentId: string
  activeEnrollment: any
  instructorId: string
}

export function StudentDetailsSimple({ studentId, activeEnrollment, instructorId }: StudentDetailsSimpleProps) {
  const [studentData, setStudentData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
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
      const response = await fetch(`/api/instructor/students/${studentId}/details`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStudentData(data)
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
          <Button onClick={fetchStudentData} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Flight Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.flightData?.totalHours?.toFixed(1) || '0.0'}</div>
            <p className="text-xs text-muted-foreground">
              Solo: {studentData.flightData?.soloHours?.toFixed(1) || '0.0'}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syllabus Progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentData.enrollment?.progress_percentage || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {studentData.enrollment?.syllabus?.title || 'No syllabus'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(studentData.billing?.account_balance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {studentData.billing?.available_hours?.toFixed(1) || '0.0'} hours available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {studentData.documents?.filter((d: any) => d.status === 'valid').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Valid documents</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for this student</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="w-full">
              <Link href={`/instructor/schedule/new?studentId=${studentId}`}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Flight
              </Link>
            </Button>
            <Button variant="outline" className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/instructor/billing/students/${studentId}`}>
                <DollarSign className="h-4 w-4 mr-2" />
                View Billing
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/instructor/documents/upload?studentId=${studentId}`}>
                <FileText className="h-4 w-4 mr-2" />
                Upload Document
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest updates for this student</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {studentData.recentActivity?.slice(0, 5).map((activity: any, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
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
            )) || (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{studentData.student?.email}</p>
              </div>
            </div>
            {studentData.student?.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{studentData.student.phone}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StudentDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
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

