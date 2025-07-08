import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export type ReportTimeframe = "week" | "month" | "quarter" | "year" | "custom"

export interface ReportFilter {
  startDate?: string
  endDate?: string
  instructorId?: string
  studentId?: string
  aircraftId?: string
  syllabusId?: string
}

export async function getFlightHoursReport(timeframe: ReportTimeframe, filters: ReportFilter = {}) {
  const supabase = await createClient(await cookies())

  // Build the date range based on timeframe
  const { startDate, endDate } = getDateRangeFromTimeframe(timeframe, filters.startDate, filters.endDate)

  let query = supabase
    .from("flight_sessions")
    .select(`
      id,
      date,
      duration,
      aircraft_id,
      student_id,
      instructor_id,
      aircraft:aircraft_id(registration, model),
      student:student_id(first_name, last_name),
      instructor:instructor_id(first_name, last_name)
    `)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })

  // Apply additional filters if provided
  if (filters.instructorId) {
    query = query.eq("instructor_id", filters.instructorId)
  }

  if (filters.studentId) {
    query = query.eq("student_id", filters.studentId)
  }

  if (filters.aircraftId) {
    query = query.eq("aircraft_id", filters.aircraftId)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching flight hours report:", error)
    throw new Error("Failed to fetch flight hours report")
  }

  // Process the data to calculate total hours, group by day, etc.
  const totalHours = data.reduce((sum, session) => sum + (session.duration || 0), 0)

  // Group by day for chart data
  const hoursByDay = data.reduce((acc: Record<string, number>, session) => {
    const day = session.date.split("T")[0]
    acc[day] = (acc[day] || 0) + (session.duration || 0)
    return acc
  }, {})

  // Convert to array format for charts
  const chartData = Object.entries(hoursByDay).map(([date, hours]) => ({
    date,
    hours,
  }))

  // Sort by date
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    totalHours,
    flightSessions: data.length,
    chartData,
    rawData: data,
  }
}

export async function getStudentProgressReport(studentId: string, syllabusId?: string) {
  const supabase = await createClient(await cookies())

  // Get student enrollment
  let enrollmentQuery = supabase
    .from("student_enrollments")
    .select(`
      id,
      start_date,
      syllabus_id,
      syllabus:syllabus_id(id, title, description, estimated_completion_hours),
      instructor:instructor_id(id, first_name, last_name)
    `)
    .eq("student_id", studentId)
    .eq("status", "active")

  if (syllabusId) {
    enrollmentQuery = enrollmentQuery.eq("syllabus_id", syllabusId)
  }

  const { data: enrollments, error: enrollmentError } = await enrollmentQuery

  if (enrollmentError) {
    console.error("Error fetching student enrollments:", enrollmentError)
    throw new Error("Failed to fetch student enrollments")
  }

  if (!enrollments || enrollments.length === 0) {
    return {
      enrollments: [],
      totalFlightHours: 0,
      completedLessons: [],
      pendingLessons: [],
      progressPercentage: 0,
      estimatedCompletionDate: null,
    }
  }

  // Get all flight sessions for this student
  const { data: flightSessions, error: sessionsError } = await supabase
    .from("flight_sessions")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false })

  if (sessionsError) {
    console.error("Error fetching flight sessions:", sessionsError)
    throw new Error("Failed to fetch flight sessions")
  }

  // Calculate total flight hours
  const totalFlightHours = flightSessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0

  // For each enrollment, get the lessons and progress
  const enrollmentData = await Promise.all(
    enrollments.map(async (enrollment) => {
      // Get all lessons for this syllabus
      const { data: lessons, error: lessonsError } = await supabase
        .from("syllabus_lessons")
        .select("*")
        .eq("syllabus_id", enrollment.syllabus_id)
        .order("order_index", { ascending: true })

      if (lessonsError) {
        console.error("Error fetching syllabus lessons:", lessonsError)
        throw new Error("Failed to fetch syllabus lessons")
      }

      // Get completed lessons for this student
      const { data: completedLessonIds, error: completedError } = await supabase
        .from("student_lesson_completions")
        .select("lesson_id")
        .eq("student_id", studentId)
        .eq("enrollment_id", enrollment.id)

      if (completedError) {
        console.error("Error fetching completed lessons:", completedError)
        throw new Error("Failed to fetch completed lessons")
      }

      const completedIds = completedLessonIds?.map((item) => item.lesson_id) || []

      // Separate completed and pending lessons
      const completedLessons = lessons?.filter((lesson) => completedIds.includes(lesson.id)) || []
      const pendingLessons = lessons?.filter((lesson) => !completedIds.includes(lesson.id)) || []

      // Calculate progress percentage
      const totalLessons = lessons?.length || 0
      const progressPercentage = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0

      // Estimate completion date based on current progress rate
      let estimatedCompletionDate = null
      if (progressPercentage > 0 && progressPercentage < 100) {
        const startDate = new Date(enrollment.start_date)
        const today = new Date()
        const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSinceStart > 0) {
          const progressRate = progressPercentage / daysSinceStart // % per day
          const daysRemaining = Math.ceil((100 - progressPercentage) / progressRate)

          estimatedCompletionDate = new Date()
          estimatedCompletionDate.setDate(today.getDate() + daysRemaining)
        }
      }

      return {
        enrollment,
        totalLessons,
        completedLessons,
        pendingLessons,
        progressPercentage,
        estimatedCompletionDate,
      }
    }),
  )

  return {
    enrollments: enrollmentData,
    totalFlightHours,
    flightSessions: flightSessions || [],
  }
}

export async function getInstructorPerformanceReport(
  instructorId: string,
  timeframe: ReportTimeframe,
  filters: ReportFilter = {},
) {
  const supabase = await createClient(await cookies())

  // Build the date range based on timeframe
  const { startDate, endDate } = getDateRangeFromTimeframe(timeframe, filters.startDate, filters.endDate)

  // Get all flight sessions for this instructor
  const { data: flightSessions, error: sessionsError } = await supabase
    .from("flight_sessions")
    .select(`
      id,
      date,
      duration,
      student_id,
      aircraft_id,
      student:student_id(first_name, last_name),
      aircraft:aircraft_id(registration, model)
    `)
    .eq("instructor_id", instructorId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })

  if (sessionsError) {
    console.error("Error fetching flight sessions:", sessionsError)
    throw new Error("Failed to fetch flight sessions")
  }

  // Get all students for this instructor
  const { data: enrollments, error: enrollmentsError } = await supabase
    .from("student_enrollments")
    .select(`
      id,
      student_id,
      syllabus_id,
      start_date,
      student:student_id(first_name, last_name),
      syllabus:syllabus_id(title)
    `)
    .eq("instructor_id", instructorId)
    .eq("status", "active")

  if (enrollmentsError) {
    console.error("Error fetching enrollments:", enrollmentsError)
    throw new Error("Failed to fetch enrollments")
  }

  // Calculate total flight hours
  const totalFlightHours = flightSessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0

  // Group flight hours by student
  const hoursByStudent =
    flightSessions?.reduce((acc: Record<string, number>, session) => {
      const studentId = session.student_id
      acc[studentId] = (acc[studentId] || 0) + (session.duration || 0)
      return acc
    }, {}) || {}

  // Group flight hours by day for chart
  const hoursByDay =
    flightSessions?.reduce((acc: Record<string, number>, session) => {
      const day = session.date.split("T")[0]
      acc[day] = (acc[day] || 0) + (session.duration || 0)
      return acc
    }, {}) || {}

  // Convert to array format for charts
  const chartData = Object.entries(hoursByDay).map(([date, hours]) => ({
    date,
    hours,
  }))

  // Sort by date
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Get student progress data
  const studentProgress = await Promise.all(
    (enrollments || []).map(async (enrollment) => {
      // Get all lessons for this syllabus
      const { data: lessons, error: lessonsError } = await supabase
        .from("syllabus_lessons")
        .select("*")
        .eq("syllabus_id", enrollment.syllabus_id)

      if (lessonsError) {
        console.error("Error fetching syllabus lessons:", lessonsError)
        throw new Error("Failed to fetch syllabus lessons")
      }

      // Get completed lessons for this student
      const { data: completedLessonIds, error: completedError } = await supabase
        .from("student_lesson_completions")
        .select("lesson_id")
        .eq("student_id", enrollment.student_id)
        .eq("enrollment_id", enrollment.id)

      if (completedError) {
        console.error("Error fetching completed lessons:", completedError)
        throw new Error("Failed to fetch completed lessons")
      }

      const totalLessons = lessons?.length || 0
      const completedLessons = completedLessonIds?.length || 0
      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

      return {
        studentId: enrollment.student_id,
        studentName: `${(enrollment.student as any)[0].first_name} ${(enrollment.student as any)[0].last_name}`,
        syllabusTitle: (enrollment.syllabus as any)[0].title,
        totalLessons,
        completedLessons,
        progressPercentage,
        flightHours: hoursByStudent[enrollment.student_id] || 0,
      }
    }),
  )

  return {
    totalFlightHours,
    flightSessions: flightSessions?.length || 0,
    activeStudents: enrollments?.length || 0,
    chartData,
    studentProgress,
    rawData: flightSessions || [],
  }
}

export async function getAircraftUtilizationReport(timeframe: ReportTimeframe, filters: ReportFilter = {}) {
  const supabase = await createClient(await cookies())

  // Build the date range based on timeframe
  const { startDate, endDate } = getDateRangeFromTimeframe(timeframe, filters.startDate, filters.endDate)

  // Get all aircraft
  const { data: aircraft, error: aircraftError } = await supabase.from("aircraft").select("*").eq("is_active", true)

  if (aircraftError) {
    console.error("Error fetching aircraft:", aircraftError)
    throw new Error("Failed to fetch aircraft")
  }

  // Get all flight sessions in the date range
  const { data: flightSessions, error: sessionsError } = await supabase
    .from("flight_sessions")
    .select(`
      id,
      date,
      duration,
      aircraft_id,
      student_id,
      instructor_id,
      student:student_id(first_name, last_name),
      instructor:instructor_id(first_name, last_name)
    `)
    .gte("date", startDate)
    .lte("date", endDate)

  if (sessionsError) {
    console.error("Error fetching flight sessions:", sessionsError)
    throw new Error("Failed to fetch flight sessions")
  }

  // Calculate utilization for each aircraft
  const aircraftUtilization =
    aircraft?.map((ac) => {
      const sessions = flightSessions?.filter((session) => session.aircraft_id === ac.id) || []
      const totalHours = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)

      // Calculate utilization percentage based on available hours
      // Assuming 8 hours per day availability
      const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      const availableHours = days * 8
      const utilizationPercentage = availableHours > 0 ? (totalHours / availableHours) * 100 : 0

      return {
        aircraftId: ac.id,
        registration: ac.registration,
        model: ac.model,
        totalHours,
        flightSessions: sessions.length,
        utilizationPercentage,
        maintenanceStatus: ac.maintenance_status,
      }
    }) || []

  // Calculate total hours across all aircraft
  const totalHours = aircraftUtilization.reduce((sum, ac) => sum + ac.totalHours, 0)

  // Group hours by day for chart
  const hoursByDay =
    flightSessions?.reduce((acc: Record<string, number>, session) => {
      const day = session.date.split("T")[0]
      acc[day] = (acc[day] || 0) + (session.duration || 0)
      return acc
    }, {}) || {}

  // Convert to array format for charts
  const chartData = Object.entries(hoursByDay).map(([date, hours]) => ({
    date,
    hours,
  }))

  // Sort by date
  chartData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    totalHours,
    totalAircraft: aircraft?.length || 0,
    aircraftUtilization,
    chartData,
  }
}

export async function getSchoolPerformanceReport(timeframe: ReportTimeframe, filters: ReportFilter = {}) {
  const supabase = await createClient(await cookies())

  // Build the date range based on timeframe
  const { startDate, endDate } = getDateRangeFromTimeframe(timeframe, filters.startDate, filters.endDate)

  // Get flight hours
  const { data: flightSessions, error: sessionsError } = await supabase
    .from("flight_sessions")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)

  if (sessionsError) {
    console.error("Error fetching flight sessions:", sessionsError)
    throw new Error("Failed to fetch flight sessions")
  }

  // Get new enrollments in the period
  const { data: newEnrollments, error: enrollmentsError } = await supabase
    .from("student_enrollments")
    .select("*")
    .gte("start_date", startDate)
    .lte("start_date", endDate)

  if (enrollmentsError) {
    console.error("Error fetching enrollments:", enrollmentsError)
    throw new Error("Failed to fetch enrollments")
  }

  // Get completed enrollments in the period
  const { data: completedEnrollments, error: completedError } = await supabase
    .from("student_enrollments")
    .select("*")
    .eq("status", "completed")
    .gte("completion_date", startDate)
    .lte("completion_date", endDate)

  if (completedError) {
    console.error("Error fetching completed enrollments:", completedError)
    throw new Error("Failed to fetch completed enrollments")
  }

  // Get active students count
  const { count: activeStudents, error: studentsError } = await supabase
    .from("student_enrollments")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")

  if (studentsError) {
    console.error("Error fetching active students:", studentsError)
    throw new Error("Failed to fetch active students")
  }

  // Get active instructors count
  const { count: activeInstructors, error: instructorsError } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "instructor")
    .eq("is_active", true)

  if (instructorsError) {
    console.error("Error fetching active instructors:", instructorsError)
    throw new Error("Failed to fetch active instructors")
  }

  // Calculate total flight hours
  const totalFlightHours = flightSessions?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0

  // Group hours by day for chart
  const hoursByDay =
    flightSessions?.reduce((acc: Record<string, number>, session) => {
      const day = session.date.split("T")[0]
      acc[day] = (acc[day] || 0) + (session.duration || 0)
      return acc
    }, {}) || {}

  // Group enrollments by day for chart
  const enrollmentsByDay =
    newEnrollments?.reduce((acc: Record<string, number>, enrollment) => {
      const day = enrollment.start_date.split("T")[0]
      acc[day] = (acc[day] || 0) + 1
      return acc
    }, {}) || {}

  // Convert to array format for charts
  const flightHoursChart = Object.entries(hoursByDay).map(([date, hours]) => ({
    date,
    hours,
  }))

  const enrollmentsChart = Object.entries(enrollmentsByDay).map(([date, count]) => ({
    date,
    count,
  }))

  // Sort by date
  flightHoursChart.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  enrollmentsChart.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return {
    totalFlightHours,
    totalFlightSessions: flightSessions?.length || 0,
    newEnrollments: newEnrollments?.length || 0,
    completedEnrollments: completedEnrollments?.length || 0,
    activeStudents: activeStudents || 0,
    activeInstructors: activeInstructors || 0,
    flightHoursChart,
    enrollmentsChart,
  }
}

// Helper function to calculate date range based on timeframe
function getDateRangeFromTimeframe(
  timeframe: ReportTimeframe,
  customStartDate?: string,
  customEndDate?: string,
): { startDate: string; endDate: string } {
  const today = new Date()
  let startDate: Date
  const endDate = new Date(today)

  if (timeframe === "custom" && customStartDate && customEndDate) {
    return {
      startDate: customStartDate,
      endDate: customEndDate,
    }
  }

  switch (timeframe) {
    case "week":
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 7)
      break
    case "month":
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 1)
      break
    case "quarter":
      startDate = new Date(today)
      startDate.setMonth(today.getMonth() - 3)
      break
    case "year":
      startDate = new Date(today)
      startDate.setFullYear(today.getFullYear() - 1)
      break
    default:
      startDate = new Date(today)
      startDate.setDate(today.getDate() - 30) // Default to 30 days
  }

  return {
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  }
}
