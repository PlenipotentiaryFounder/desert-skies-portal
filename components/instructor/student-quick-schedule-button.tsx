"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2, Calendar } from "lucide-react"
import { ExpressScheduleModal, type ScheduleData } from "./express-schedule-modal"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface StudentQuickScheduleButtonProps {
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  enrollmentId: string
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function StudentQuickScheduleButton({
  student,
  enrollmentId,
  variant = "default",
  size = "default",
  className
}: StudentQuickScheduleButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lessons, setLessons] = useState<any[]>([])
  const [aircraft, setAircraft] = useState<any[]>([])
  const [nextLesson, setNextLesson] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch lessons and next lesson suggestion when modal opens
  useEffect(() => {
    if (modalOpen) {
      fetchData()
    }
  }, [modalOpen])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch lessons for the student's syllabus
      const lessonsRes = await fetch(`/api/enrollments/${enrollmentId}/lessons`)
      if (lessonsRes.ok) {
        const data = await lessonsRes.json()
        setLessons(data.lessons || [])
      }

      // Fetch aircraft
      const aircraftRes = await fetch('/api/aircraft')
      if (aircraftRes.ok) {
        const data = await aircraftRes.json()
        setAircraft(data.aircraft || [])
      }

      // Fetch next lesson suggestion
      const suggestionsRes = await fetch(`/api/enrollments/${enrollmentId}/lesson-suggestions`)
      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json()
        const next = data.suggestions?.find((s: any) => s.type === 'next')
        if (next?.lesson) {
          setNextLesson(next.lesson)
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
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
        description: `${student.first_name}'s mission has been scheduled successfully.`
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

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setModalOpen(true)}
      >
        <Calendar className="mr-2 h-4 w-4" />
        {nextLesson ? (
          <>
            <span className="hidden sm:inline">Schedule Next: </span>
            <span className="font-semibold">{nextLesson.title}</span>
          </>
        ) : (
          'Schedule Mission'
        )}
      </Button>

      <ExpressScheduleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        preselectedStudent={{
          ...student,
          enrollment_id: enrollmentId
        }}
        preselectedLesson={nextLesson}
        students={[{ ...student, enrollment_id: enrollmentId }]}
        lessons={lessons}
        aircraft={aircraft}
        onSchedule={handleSchedule}
      />
    </>
  )
}

