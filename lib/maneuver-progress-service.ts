"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

// ============================================================================
// TYPES
// ============================================================================

export type PerformanceLevel = 
  | "unsatisfactory" 
  | "progressing" 
  | "proficient" 
  | "exceptional"

export type Trend = "improving" | "stable" | "declining" | "insufficient_data"

export interface StudentManeuverProgress {
  id: string
  student_id: string
  maneuver_id: string
  total_attempts: number
  first_attempt_date: string | null
  last_attempt_date: string | null
  latest_mission_id: string | null
  latest_score: number | null
  latest_performance_level: PerformanceLevel | null
  acs_standard_met: boolean | null
  average_score: number | null
  trend: Trend | null
  scores_history: number[] | null
  latest_instructor_notes: string | null
  common_strengths: string[] | null
  common_areas_for_improvement: string[] | null
  first_proficient_date: string | null
  consistently_proficient: boolean
  checkride_ready: boolean
  updated_at: string
  
  // Populated fields
  maneuver?: {
    id: string
    name: string
    category: string
    description: string
    faa_reference: string
    primary_acs_task_code: string | null
  }
  latest_mission?: {
    id: string
    mission_code: string
    scheduled_date: string
    instructor: {
      first_name: string
      last_name: string
    }
  }
}

export interface ManeuverProgressSummary {
  total_maneuvers: number
  proficient_maneuvers: number
  checkride_ready_maneuvers: number
  maneuvers_needing_attention: number
  average_proficiency: number
  recent_trend: "improving" | "stable" | "declining"
}

export interface ManeuverProgressChart {
  maneuver_name: string
  maneuver_id: string
  scores_history: Array<{
    score: number
    date: string
    mission_code: string
  }>
  current_level: PerformanceLevel
  trend: Trend
}

export interface CheckrideReadinessReport {
  overall_ready: boolean
  ready_percentage: number
  maneuvers_ready: Array<{
    name: string
    category: string
    consistently_proficient: boolean
    latest_score: number
  }>
  maneuvers_not_ready: Array<{
    name: string
    category: string
    latest_score: number | null
    attempts: number
    recommendation: string
  }>
  recommended_focus_areas: string[]
}

// ============================================================================
// QUERY OPERATIONS
// ============================================================================

/**
 * Get all maneuver progress for a student
 */
export async function getStudentManeuverProgress(
  studentId: string,
  options?: {
    includeManeuverDetails?: boolean
    includeLatestMission?: boolean
  }
): Promise<StudentManeuverProgress[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    let selectQuery = "*"
    
    if (options?.includeManeuverDetails) {
      selectQuery += `, maneuver:maneuver_id (
        id,
        name,
        category,
        description,
        faa_reference,
        primary_acs_task_code
      )`
    }
    
    if (options?.includeLatestMission) {
      selectQuery += `, latest_mission:latest_mission_id (
        id,
        mission_code,
        scheduled_date,
        instructor:assigned_instructor_id (
          first_name,
          last_name
        )
      )`
    }

    const { data, error } = await supabase
      .from("student_maneuver_progress")
      .select(selectQuery)
      .eq("student_id", studentId)
      .order("last_attempt_date", { ascending: false, nullsFirst: false })

    if (error) {
      console.error("Error fetching student maneuver progress:", error)
      return []
    }

    return data as StudentManeuverProgress[]
  } catch (error) {
    console.error("Error in getStudentManeuverProgress:", error)
    return []
  }
}

/**
 * Get progress for a specific maneuver
 */
export async function getManeuverProgressById(
  progressId: string
): Promise<StudentManeuverProgress | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("student_maneuver_progress")
      .select(`
        *,
        maneuver:maneuver_id (
          id,
          name,
          category,
          description,
          faa_reference,
          primary_acs_task_code
        ),
        latest_mission:latest_mission_id (
          id,
          mission_code,
          scheduled_date,
          instructor:assigned_instructor_id (
            first_name,
            last_name
          )
        )
      `)
      .eq("id", progressId)
      .single()

    if (error) {
      console.error("Error fetching maneuver progress:", error)
      return null
    }

    return data as StudentManeuverProgress
  } catch (error) {
    console.error("Error in getManeuverProgressById:", error)
    return null
  }
}

/**
 * Get progress for a specific student-maneuver pair
 */
export async function getStudentManeuverProgressByManeuver(
  studentId: string,
  maneuverId: string
): Promise<StudentManeuverProgress | null> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from("student_maneuver_progress")
      .select(`
        *,
        maneuver:maneuver_id (
          id,
          name,
          category,
          description,
          faa_reference,
          primary_acs_task_code
        )
      `)
      .eq("student_id", studentId)
      .eq("maneuver_id", maneuverId)
      .single()

    if (error) {
      console.error("Error fetching maneuver progress:", error)
      return null
    }

    return data as StudentManeuverProgress
  } catch (error) {
    console.error("Error in getStudentManeuverProgressByManeuver:", error)
    return null
  }
}

// ============================================================================
// ANALYTICS & REPORTS
// ============================================================================

/**
 * Get maneuver progress summary for a student
 */
export async function getManeuverProgressSummary(
  studentId: string
): Promise<ManeuverProgressSummary> {
  try {
    const progress = await getStudentManeuverProgress(studentId)

    const totalManeuvers = progress.length
    const proficientManeuvers = progress.filter(
      p => p.consistently_proficient
    ).length
    const checkrideReadyManeuvers = progress.filter(
      p => p.checkride_ready
    ).length
    const maneuversNeedingAttention = progress.filter(
      p => p.latest_score !== null && p.latest_score < 3
    ).length

    // Calculate average proficiency
    const validScores = progress.filter(p => p.average_score !== null)
    const averageProficiency = validScores.length > 0
      ? validScores.reduce((sum, p) => sum + (p.average_score || 0), 0) / validScores.length
      : 0

    // Determine recent trend
    const improvingCount = progress.filter(p => p.trend === "improving").length
    const decliningCount = progress.filter(p => p.trend === "declining").length
    
    let recentTrend: "improving" | "stable" | "declining" = "stable"
    if (improvingCount > decliningCount) recentTrend = "improving"
    else if (decliningCount > improvingCount) recentTrend = "declining"

    return {
      total_maneuvers: totalManeuvers,
      proficient_maneuvers: proficientManeuvers,
      checkride_ready_maneuvers: checkrideReadyManeuvers,
      maneuvers_needing_attention: maneuversNeedingAttention,
      average_proficiency: Math.round(averageProficiency * 100) / 100,
      recent_trend: recentTrend,
    }
  } catch (error) {
    console.error("Error in getManeuverProgressSummary:", error)
    return {
      total_maneuvers: 0,
      proficient_maneuvers: 0,
      checkride_ready_maneuvers: 0,
      maneuvers_needing_attention: 0,
      average_proficiency: 0,
      recent_trend: "stable",
    }
  }
}

/**
 * Get maneuver progress charts for visualization
 */
export async function getManeuverProgressCharts(
  studentId: string
): Promise<ManeuverProgressChart[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get progress with maneuver details
    const progress = await getStudentManeuverProgress(studentId, {
      includeManeuverDetails: true,
    })

    // Get all maneuver scores for this student to build history
    const { data: allScores } = await supabase
      .from("maneuver_scores")
      .select(`
        maneuver_id,
        numeric_score,
        scored_at,
        mission:mission_id (
          mission_code,
          scheduled_date
        )
      `)
      .eq("student_id", studentId)
      .order("scored_at", { ascending: true })

    const charts: ManeuverProgressChart[] = []

    for (const p of progress) {
      if (!p.maneuver) continue

      // Get scores history for this maneuver
      const maneuverScores = allScores?.filter(
        s => s.maneuver_id === p.maneuver_id
      ) || []

      const scoresHistory = maneuverScores.map(s => ({
        score: s.numeric_score || 0,
        date: s.scored_at || "",
        mission_code: s.mission?.mission_code || "",
      }))

      charts.push({
        maneuver_name: p.maneuver.name,
        maneuver_id: p.maneuver_id,
        scores_history: scoresHistory,
        current_level: p.latest_performance_level || "progressing",
        trend: p.trend || "insufficient_data",
      })
    }

    return charts
  } catch (error) {
    console.error("Error in getManeuverProgressCharts:", error)
    return []
  }
}

/**
 * Get checkride readiness report
 */
export async function getCheckrideReadinessReport(
  studentId: string,
  certificateType?: string
): Promise<CheckrideReadinessReport> {
  try {
    const progress = await getStudentManeuverProgress(studentId, {
      includeManeuverDetails: true,
    })

    const maneuversReady: Array<{
      name: string
      category: string
      consistently_proficient: boolean
      latest_score: number
    }> = []

    const maneuversNotReady: Array<{
      name: string
      category: string
      latest_score: number | null
      attempts: number
      recommendation: string
    }> = []

    for (const p of progress) {
      if (!p.maneuver) continue

      if (p.consistently_proficient && p.checkride_ready) {
        maneuversReady.push({
          name: p.maneuver.name,
          category: p.maneuver.category,
          consistently_proficient: p.consistently_proficient,
          latest_score: p.latest_score || 0,
        })
      } else {
        let recommendation = ""
        if (p.total_attempts < 3) {
          recommendation = "Needs more practice - insufficient attempts"
        } else if ((p.average_score || 0) < 3) {
          recommendation = "Not meeting ACS standards - additional training required"
        } else if (!p.consistently_proficient) {
          recommendation = "Inconsistent performance - needs 3 consecutive proficient scores"
        }

        maneuversNotReady.push({
          name: p.maneuver.name,
          category: p.maneuver.category,
          latest_score: p.latest_score,
          attempts: p.total_attempts,
          recommendation,
        })
      }
    }

    const readyPercentage = progress.length > 0
      ? Math.round((maneuversReady.length / progress.length) * 100)
      : 0

    const overallReady = readyPercentage >= 90 && maneuversNotReady.length <= 2

    // Generate recommended focus areas
    const recommendedFocusAreas: string[] = []
    
    // Group not-ready maneuvers by category
    const categoryCounts = new Map<string, number>()
    for (const m of maneuversNotReady) {
      categoryCounts.set(m.category, (categoryCounts.get(m.category) || 0) + 1)
    }

    // Top 3 categories needing work
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    for (const [category, count] of topCategories) {
      recommendedFocusAreas.push(
        `${category} (${count} maneuver${count > 1 ? 's' : ''} needing improvement)`
      )
    }

    return {
      overall_ready: overallReady,
      ready_percentage: readyPercentage,
      maneuvers_ready: maneuversReady,
      maneuvers_not_ready: maneuversNotReady,
      recommended_focus_areas: recommendedFocusAreas,
    }
  } catch (error) {
    console.error("Error in getCheckrideReadinessReport:", error)
    return {
      overall_ready: false,
      ready_percentage: 0,
      maneuvers_ready: [],
      maneuvers_not_ready: [],
      recommended_focus_areas: [],
    }
  }
}

/**
 * Get maneuvers by category with progress
 */
export async function getManeuversByCategory(
  studentId: string
): Promise<Map<string, StudentManeuverProgress[]>> {
  try {
    const progress = await getStudentManeuverProgress(studentId, {
      includeManeuverDetails: true,
    })

    const byCategory = new Map<string, StudentManeuverProgress[]>()

    for (const p of progress) {
      if (!p.maneuver) continue
      
      const category = p.maneuver.category
      if (!byCategory.has(category)) {
        byCategory.set(category, [])
      }
      byCategory.get(category)!.push(p)
    }

    return byCategory
  } catch (error) {
    console.error("Error in getManeuversByCategory:", error)
    return new Map()
  }
}

/**
 * Get recent progress (last 30 days)
 */
export async function getRecentProgress(
  studentId: string,
  days: number = 30
): Promise<StudentManeuverProgress[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from("student_maneuver_progress")
      .select(`
        *,
        maneuver:maneuver_id (
          id,
          name,
          category,
          primary_acs_task_code
        ),
        latest_mission:latest_mission_id (
          id,
          mission_code,
          scheduled_date
        )
      `)
      .eq("student_id", studentId)
      .gte("last_attempt_date", cutoffDateStr)
      .order("last_attempt_date", { ascending: false })

    if (error) {
      console.error("Error fetching recent progress:", error)
      return []
    }

    return data as StudentManeuverProgress[]
  } catch (error) {
    console.error("Error in getRecentProgress:", error)
    return []
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Manually update maneuver progress (instructor adjustment)
 */
export async function updateManeuverProgress(
  progressId: string,
  updates: {
    checkride_ready?: boolean
    instructor_notes?: string
    consistently_proficient?: boolean
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
      .from("student_maneuver_progress")
      .update(updates)
      .eq("id", progressId)

    if (error) {
      console.error("Error updating maneuver progress:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/instructor/students")
    revalidatePath("/student/progress")

    return { success: true }
  } catch (error) {
    console.error("Error in updateManeuverProgress:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Bulk update checkride readiness
 */
export async function bulkUpdateCheckrideReadiness(
  studentId: string,
  maneuverIds: string[],
  isReady: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
      .from("student_maneuver_progress")
      .update({ checkride_ready: isReady })
      .eq("student_id", studentId)
      .in("maneuver_id", maneuverIds)

    if (error) {
      console.error("Error bulk updating checkride readiness:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/instructor/students")
    revalidatePath("/student/progress")

    return { success: true }
  } catch (error) {
    console.error("Error in bulkUpdateCheckrideReadiness:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// ============================================================================
// HISTORICAL NOTES
// ============================================================================

/**
 * Get historical notes for a specific student on a specific maneuver
 * Returns all maneuver scores with instructor notes, ordered by date (newest first)
 */
export async function getManeuverHistoricalNotes(studentId: string, maneuverId: string) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const { data, error } = await supabase
    .from('maneuver_scores')
    .select(`
      id,
      scored_at,
      instructor_notes,
      performance_level,
      numeric_score,
      areas_of_strength,
      areas_for_improvement,
      specific_observations,
      acs_standard_met,
      student_attempt_number,
      mission:missions (
        id,
        mission_code,
        scheduled_date
      ),
      instructor:profiles!instructor_id (
        id,
        first_name,
        last_name
      )
    `)
    .eq('student_id', studentId)
    .eq('maneuver_id', maneuverId)
    .order('scored_at', { ascending: false })

  if (error) {
    console.error('Error fetching maneuver historical notes:', error)
    return []
  }

  return data || []
}

// ============================================================================
// COMPARISON & INSIGHTS
// ============================================================================

/**
 * Compare student performance to cohort average
 */
export async function compareToCohor(
  studentId: string,
  enrollmentId: string
): Promise<{
  student_average: number
  cohort_average: number
  percentile: number
  better_than_percent: number
}> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get student's average
    const { data: studentProgress } = await supabase
      .from("student_maneuver_progress")
      .select("average_score")
      .eq("student_id", studentId)

    const studentAvg = studentProgress && studentProgress.length > 0
      ? studentProgress.reduce((sum, p) => sum + (p.average_score || 0), 0) / studentProgress.length
      : 0

    // Get all students in same enrollment/program
    const { data: enrollment } = await supabase
      .from("student_enrollments")
      .select("syllabus_id")
      .eq("id", enrollmentId)
      .single()

    if (!enrollment) {
      return {
        student_average: studentAvg,
        cohort_average: 0,
        percentile: 0,
        better_than_percent: 0,
      }
    }

    // Get all students in same program
    const { data: cohortEnrollments } = await supabase
      .from("student_enrollments")
      .select("student_id")
      .eq("syllabus_id", enrollment.syllabus_id)

    if (!cohortEnrollments) {
      return {
        student_average: studentAvg,
        cohort_average: 0,
        percentile: 0,
        better_than_percent: 0,
      }
    }

    const cohortStudentIds = cohortEnrollments.map(e => e.student_id)

    // Get cohort averages
    const cohortAverages: number[] = []
    for (const sid of cohortStudentIds) {
      const { data: progress } = await supabase
        .from("student_maneuver_progress")
        .select("average_score")
        .eq("student_id", sid)

      if (progress && progress.length > 0) {
        const avg = progress.reduce((sum, p) => sum + (p.average_score || 0), 0) / progress.length
        cohortAverages.push(avg)
      }
    }

    const cohortAvg = cohortAverages.length > 0
      ? cohortAverages.reduce((sum, avg) => sum + avg, 0) / cohortAverages.length
      : 0

    // Calculate percentile
    const betterThanCount = cohortAverages.filter(avg => studentAvg > avg).length
    const betterThanPercent = cohortAverages.length > 0
      ? Math.round((betterThanCount / cohortAverages.length) * 100)
      : 0

    return {
      student_average: Math.round(studentAvg * 100) / 100,
      cohort_average: Math.round(cohortAvg * 100) / 100,
      percentile: betterThanPercent,
      better_than_percent: betterThanPercent,
    }
  } catch (error) {
    console.error("Error in compareToCohor:", error)
    return {
      student_average: 0,
      cohort_average: 0,
      percentile: 0,
      better_than_percent: 0,
    }
  }
}

/**
 * Get trending maneuvers (most improved or declined)
 */
export async function getTrendingManeuvers(
  studentId: string,
  trendType: "improving" | "declining"
): Promise<StudentManeuverProgress[]> {
  try {
    const progress = await getStudentManeuverProgress(studentId, {
      includeManeuverDetails: true,
    })

    return progress
      .filter(p => p.trend === trendType)
      .sort((a, b) => {
        // Sort by change magnitude
        const aHistory = a.scores_history || []
        const bHistory = b.scores_history || []
        
        const aChange = aHistory.length >= 2 
          ? aHistory[aHistory.length - 1] - aHistory[0]
          : 0
        const bChange = bHistory.length >= 2 
          ? bHistory[bHistory.length - 1] - bHistory[0]
          : 0

        return trendType === "improving" 
          ? bChange - aChange 
          : aChange - bChange
      })
      .slice(0, 5)
  } catch (error) {
    console.error("Error in getTrendingManeuvers:", error)
    return []
  }
}

