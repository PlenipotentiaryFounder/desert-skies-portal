"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar as CalendarIcon, Clock, Plane, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TimeBlocksDisplay } from "./time-blocks-display"

interface Student {
  id: string
  first_name: string
  last_name: string
  email: string
  enrollment_id?: string
}

interface Lesson {
  id: string
  title: string
  lesson_type: string
  estimated_duration_hours?: number
  order_index?: number
}

interface Aircraft {
  id: string
  tail_number: string
  make: string
  model: string
}

interface ExpressScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedStudent?: Student
  preselectedLesson?: Lesson
  preselectedDate?: Date
  preselectedTime?: string
  students?: Student[]
  lessons?: Lesson[]
  aircraft?: Aircraft[]
  onSchedule: (data: ScheduleData) => Promise<void>
}

export interface ScheduleData {
  studentId: string
  enrollmentId: string
  lessonId: string
  date: string
  startTime: string
  aircraftId?: string
  missionType: 'F' | 'G' | 'S'
  generatePOA: boolean
}

const commonTimes = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00"
]

export function ExpressScheduleModal({
  open,
  onOpenChange,
  preselectedStudent,
  preselectedLesson,
  preselectedDate,
  preselectedTime,
  students = [],
  lessons = [],
  aircraft = [],
  onSchedule
}: ExpressScheduleModalProps) {
  const [studentId, setStudentId] = useState(preselectedStudent?.id || "")
  const [enrollmentId, setEnrollmentId] = useState(preselectedStudent?.enrollment_id || "")
  const [lessonId, setLessonId] = useState(preselectedLesson?.id || "")
  const [date, setDate] = useState<Date | undefined>(preselectedDate)
  const [startTime, setStartTime] = useState(preselectedTime || "07:00")
  const [aircraftId, setAircraftId] = useState("")
  const [generatePOA, setGeneratePOA] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setStudentId(preselectedStudent?.id || "")
      setEnrollmentId(preselectedStudent?.enrollment_id || "")
      setLessonId(preselectedLesson?.id || "")
      setDate(preselectedDate)
      setStartTime(preselectedTime || "07:00")
      setError(null)
    }
  }, [open, preselectedStudent, preselectedLesson, preselectedDate, preselectedTime])

  // Update enrollment when student changes
  useEffect(() => {
    if (studentId) {
      const student = students.find(s => s.id === studentId)
      if (student?.enrollment_id) {
        setEnrollmentId(student.enrollment_id)
      }
    }
  }, [studentId, students])

  const selectedStudent = students.find(s => s.id === studentId)
  const selectedLesson = lessons.find(l => l.id === lessonId)

  const getMissionType = (): 'F' | 'G' | 'S' => {
    if (!selectedLesson) return 'F'
    const type = selectedLesson.lesson_type?.toLowerCase()
    if (type === 'flight') return 'F'
    if (type === 'ground') return 'G'
    if (type === 'simulator') return 'S'
    return 'F'
  }

  const missionType = getMissionType()
  const needsAircraft = missionType === 'F'

  const canSubmit = studentId && enrollmentId && lessonId && date && startTime && 
                     (!needsAircraft || aircraftId)

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Please fill in all required fields")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await onSchedule({
        studentId,
        enrollmentId,
        lessonId,
        date: format(date!, 'yyyy-MM-dd'),
        startTime,
        aircraftId: needsAircraft ? aircraftId : undefined,
        missionType,
        generatePOA
      })
      
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || "Failed to schedule mission")
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Quick Schedule Mission
          </DialogTitle>
          <DialogDescription>
            Schedule a mission in just a few clicks
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Student Selection */}
          {!preselectedStudent && (
            <div className="space-y-2">
              <Label htmlFor="student">Student *</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.first_name} {student.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {preselectedStudent && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Student</div>
              <div className="font-semibold">
                {preselectedStudent.first_name} {preselectedStudent.last_name}
              </div>
            </div>
          )}

          {/* Lesson Selection */}
          <div className="space-y-2">
            <Label htmlFor="lesson">Lesson *</Label>
            <Select value={lessonId} onValueChange={setLessonId}>
              <SelectTrigger id="lesson">
                <SelectValue placeholder="Select lesson" />
              </SelectTrigger>
              <SelectContent>
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    <div className="flex items-center gap-2">
                      <span>{lesson.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {lesson.lesson_type}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLesson && preselectedLesson && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Recommended next lesson
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label htmlFor="time">Start Time *</Label>
            <Select value={startTime} onValueChange={setStartTime}>
              <SelectTrigger id="time">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {commonTimes.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aircraft Selection (for flights only) */}
          {needsAircraft && (
            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft *</Label>
              <Select value={aircraftId} onValueChange={setAircraftId}>
                <SelectTrigger id="aircraft">
                  <SelectValue placeholder="Select aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map((plane) => (
                    <SelectItem key={plane.id} value={plane.id}>
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4" />
                        {plane.tail_number} ({plane.make} {plane.model})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Time Blocks Preview */}
          {selectedLesson && date && startTime && (
            <div className="pt-4">
              <TimeBlocksDisplay
                missionType={missionType}
                startTime={startTime}
                trainingDurationMinutes={
                  selectedLesson.estimated_duration_hours 
                    ? selectedLesson.estimated_duration_hours * 60 
                    : 120
                }
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Scheduling..." : "Schedule Mission"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

