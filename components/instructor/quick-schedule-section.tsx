"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Rocket, Calendar, Loader2, ArrowRight } from "lucide-react"
import { ExpressScheduleModal, type ScheduleData } from "./express-schedule-modal"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { getInitials } from "@/lib/utils"

interface StudentWithNextLesson {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
  enrollment_id: string
  next_lesson?: {
    id: string
    title: string
    lesson_type: string
    order_index: number
    estimated_duration_hours?: number
  }
}

export function QuickScheduleSection() {
  const [students, setStudents] = useState<StudentWithNextLesson[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentWithNextLesson | null>(null)
  const [lessons, setLessons] = useState<any[]>([])
  const [aircraft, setAircraft] = useState<any[]>([])
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchStudents()
    fetchAircraft()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/instructor/students/active')
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAircraft = async () => {
    try {
      const response = await fetch('/api/aircraft')
      if (response.ok) {
        const data = await response.json()
        setAircraft(data.aircraft || [])
      }
    } catch (error) {
      console.error('Error fetching aircraft:', error)
    }
  }

  const handleQuickSchedule = async (student: StudentWithNextLesson) => {
    setSelectedStudent(student)
    
    // Fetch lessons for this student
    try {
      const response = await fetch(`/api/enrollments/${student.enrollment_id}/lessons`)
      if (response.ok) {
        const data = await response.json()
        setLessons(data.lessons || [])
      }
    } catch (error) {
      console.error('Error fetching lessons:', error)
    }
    
    setModalOpen(true)
  }

  const handleSchedule = async (scheduleData: ScheduleData) => {
    try {
      const response = await fetch('/api/instructor/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: scheduleData.enrollmentId,
          studentId: scheduleData.studentId,
          lessonId: scheduleData.lessonId,
          mode: 'precreated',
          missionType: scheduleData.missionType,
          date: scheduleData.date,
          startTime: scheduleData.startTime,
          aircraftId: scheduleData.aircraftId,
          generatePOA: scheduleData.generatePOA
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to schedule mission')
      }

      toast({
        title: 'Mission Scheduled!',
        description: `Mission scheduled successfully for ${selectedStudent?.first_name}.`
      })

      // Navigate to mission detail page
      router.push(`/instructor/missions/${result.data.id}`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to schedule mission',
        variant: 'destructive'
      })
      throw error
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Quick Schedule - Your Students
          </CardTitle>
          <CardDescription>
            Schedule next missions for your active students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Quick Schedule - Your Students
          </CardTitle>
          <CardDescription>
            Schedule next missions for your active students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No active students found. Students will appear here once they're enrolled.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Quick Schedule - Your Students
          </CardTitle>
          <CardDescription>
            Schedule next missions for your active students in just a few clicks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={student.avatar_url} alt={student.first_name} />
                <AvatarFallback>
                  {getInitials(student.first_name, student.last_name)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {student.first_name} {student.last_name}
                </div>
                {student.next_lesson ? (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>Next: {student.next_lesson.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {student.next_lesson.lesson_type}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No lessons available
                  </div>
                )}
              </div>
              
              <Button
                size="sm"
                onClick={() => handleQuickSchedule(student)}
                disabled={!student.next_lesson}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {selectedStudent && (
        <ExpressScheduleModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          preselectedStudent={{
            ...selectedStudent,
            enrollment_id: selectedStudent.enrollment_id
          }}
          preselectedLesson={selectedStudent.next_lesson}
          students={students.map(s => ({ ...s, enrollment_id: s.enrollment_id }))}
          lessons={lessons}
          aircraft={aircraft}
          onSchedule={handleSchedule}
        />
      )}
    </>
  )
}

