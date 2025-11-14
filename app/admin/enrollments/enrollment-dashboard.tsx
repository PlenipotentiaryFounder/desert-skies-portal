"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  GraduationCap, 
  Clock, 
  CheckCircle2,
  Plane,
  FileText,
  UserCog
} from "lucide-react"
import { EnrollmentCard } from "./enrollment-card"
import { EnrollmentApprovalDialog } from "./enrollment-approval-dialog"

interface EnrollmentDashboardProps {
  enrollments: any[]
  syllabi: any[]
  onboardingData: any[]
  documentData: any[]
}

export function EnrollmentDashboard({ 
  enrollments, 
  syllabi,
  onboardingData,
  documentData
}: EnrollmentDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<'pending' | 'active' | 'graduated'>('pending')
  const [enrollmentToApprove, setEnrollmentToApprove] = useState<any>(null)

  // Calculate counts by syllabus (only active enrollments)
  const activeEnrollments = enrollments.filter(e => e.status === 'active')
  const syllabusCounts = syllabi.map(syllabus => {
    const category = syllabus.code || syllabus.target_certificate || syllabus.faa_type || 'Other'
    return {
      ...syllabus,
      category: category.toUpperCase(),
      count: activeEnrollments.filter(e => e.syllabus?.id === syllabus.id).length
    }
  })

  // Filter enrollments by status
  const pendingEnrollments = enrollments.filter(e => e.status === 'pending_approval')
  const activeEnrollmentsFiltered = enrollments.filter(e => e.status === 'active')
  const graduatedEnrollments = enrollments.filter(e => e.status === 'completed')

  // Get display enrollments based on selected tab
  const displayEnrollments = selectedTab === 'pending' 
    ? pendingEnrollments 
    : selectedTab === 'active' 
    ? activeEnrollmentsFiltered 
    : graduatedEnrollments

  const totalCounts = {
    pending: pendingEnrollments.length,
    active: activeEnrollmentsFiltered.length,
    graduated: graduatedEnrollments.length
  }

  return (
    <div className="space-y-6">
      {/* Syllabus Count Cards */}
      <div>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Active Enrollments by Program</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {syllabusCounts.map((syllabus) => (
            <Card key={syllabus.id} className="border-l-4 border-l-primary">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {syllabus.category}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{syllabus.count}</span>
                  <span className="text-xs text-muted-foreground">students</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{syllabus.title}</p>
              </CardContent>
            </Card>
          ))}
          
          {/* Total Active Card */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Total Active
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-green-600">{activeEnrollmentsFiltered.length}</span>
                <span className="text-xs text-muted-foreground">students</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">All programs</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabbed Enrollment Lists */}
      <Card>
        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="pending" className="relative">
                  <Clock className="w-4 h-4 mr-1.5" />
                  Pending
                  {totalCounts.pending > 0 && (
                    <Badge variant="destructive" className="ml-2 rounded-full h-5 w-5 p-0 text-xs">
                      {totalCounts.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="active">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Active
                  <Badge variant="secondary" className="ml-2 rounded-full h-5 w-5 p-0 text-xs">
                    {totalCounts.active}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="graduated">
                  <GraduationCap className="w-4 h-4 mr-1.5" />
                  Graduated
                  <Badge variant="secondary" className="ml-2 rounded-full h-5 w-5 p-0 text-xs">
                    {totalCounts.graduated}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <TabsContent value="pending" className="mt-0">
              <EnrollmentList 
                enrollments={pendingEnrollments} 
                type="pending"
                onApprove={setEnrollmentToApprove}
                emptyMessage="No pending enrollments"
                emptyDescription="All enrollment requests have been processed"
              />
            </TabsContent>

            <TabsContent value="active" className="mt-0">
              <EnrollmentList 
                enrollments={activeEnrollmentsFiltered} 
                type="active"
                emptyMessage="No active enrollments"
                emptyDescription="No students are currently enrolled in training programs"
              />
            </TabsContent>

            <TabsContent value="graduated" className="mt-0">
              <EnrollmentList 
                enrollments={graduatedEnrollments} 
                type="graduated"
                emptyMessage="No graduated students"
                emptyDescription="No students have completed their training programs yet"
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Enrollment Approval Dialog */}
      {enrollmentToApprove && (
        <EnrollmentApprovalDialog
          enrollment={enrollmentToApprove}
          onboardingData={onboardingData.find(o => o.user_id === enrollmentToApprove.student?.id)}
          documentData={documentData.filter(d => d.student_id === enrollmentToApprove.student?.id)}
          open={!!enrollmentToApprove}
          onOpenChange={(open) => !open && setEnrollmentToApprove(null)}
        />
      )}
    </div>
  )
}

interface EnrollmentListProps {
  enrollments: any[]
  type: 'pending' | 'active' | 'graduated'
  onApprove?: (enrollment: any) => void
  emptyMessage: string
  emptyDescription: string
}

function EnrollmentList({ enrollments, type, onApprove, emptyMessage, emptyDescription }: EnrollmentListProps) {
  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{emptyMessage}</h3>
        <p className="text-xs text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="divide-y">
      {enrollments.map((enrollment) => (
        <EnrollmentCard 
          key={enrollment.id} 
          enrollment={enrollment} 
          type={type}
          onApprove={onApprove ? () => onApprove(enrollment) : undefined}
        />
      ))}
    </div>
  )
}

