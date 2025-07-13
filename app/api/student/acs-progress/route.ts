import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const certificateType = searchParams.get("certificateType") || "private_pilot"

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get ACS areas for the certificate type
    const { data: areasData, error: areasError } = await supabase
      .from("acs_areas")
      .select(`
        id,
        code,
        area_code,
        title,
        description,
        order_index,
        acs_tasks (
          id,
          code,
          task_code,
          title,
          description,
          knowledge_elements,
          risk_management_elements,
          skill_elements,
          order_index
        )
      `)
      .eq("certificate_type", certificateType)
      .order("order_index", { ascending: true })

    if (areasError) {
      console.error("Error fetching ACS areas:", areasError)
      return NextResponse.json({ error: "Failed to fetch ACS areas" }, { status: 500 })
    }

    // Get student's ACS progress
    const { data: progressData, error: progressError } = await supabase
      .from("student_acs_progress")
      .select(`
        acs_task_id,
        proficiency_level,
        last_evaluated,
        evaluator_id,
        notes
      `)
      .eq("student_id", user.id)

    if (progressError) {
      console.error("Error fetching student progress:", progressError)
      return NextResponse.json({ error: "Failed to fetch student progress" }, { status: 500 })
    }

    // Get recent maneuver scores to determine if standards are met
    const { data: scoresData, error: scoresError } = await supabase
      .from("maneuver_scores")
      .select(`
        acs_task_id,
        meets_acs_standard,
        score,
        created_at,
        flight_session:flight_session_id (
          enrollment:enrollment_id (
            student_id
          )
        )
      `)
      .not("acs_task_id", "is", null)
      .order("created_at", { ascending: false })

    if (scoresError) {
      console.error("Error fetching maneuver scores:", scoresError)
      return NextResponse.json({ error: "Failed to fetch maneuver scores" }, { status: 500 })
    }

    // Filter scores for this student
    const studentScores = scoresData?.filter(
      score => score.flight_session?.enrollment?.student_id === user.id
    ) || []

    // Process areas and calculate progress
    const processedAreas = (areasData || []).map((area: any) => {
      // Sort tasks by order_index
      const sortedTasks = (area.acs_tasks || []).sort((a: any, b: any) => a.order_index - b.order_index)
      
      const tasks = sortedTasks.map((task: any) => {
        const progress = progressData?.find(p => p.acs_task_id === task.id)
        const recentScore = studentScores.find(s => s.acs_task_id === task.id)
        
        return {
          id: task.id,
          task_code: task.task_code || task.code,
          title: task.title,
          description: task.description,
          knowledge_elements: task.knowledge_elements || [],
          risk_management_elements: task.risk_management_elements || [],
          skill_elements: task.skill_elements || [],
          proficiency_level: progress?.proficiency_level || 0,
          last_evaluated: progress?.last_evaluated || recentScore?.created_at || null,
          evaluator_id: progress?.evaluator_id || null,
          notes: progress?.notes || null,
          meets_standard: recentScore?.meets_acs_standard || false,
          latest_score: recentScore?.score || null,
        }
      })

      const completedTasks = tasks.filter(task => task.proficiency_level >= 3 && task.meets_standard).length
      const totalTasks = tasks.length
      const completion_percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      return {
        id: area.id,
        area_code: area.area_code || area.code,
        title: area.title,
        description: area.description,
        order_index: area.order_index,
        tasks,
        completion_percentage,
        tasks_completed: completedTasks,
        total_tasks: totalTasks,
      }
    })

    // Calculate overall progress
    const totalTasks = processedAreas.reduce((sum, area) => sum + area.total_tasks, 0)
    const completedTasks = processedAreas.reduce((sum, area) => sum + area.tasks_completed, 0)
    const overall_completion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Determine checkride readiness
    const checkride_ready = overall_completion >= 80

    return NextResponse.json({
      certificate_type: certificateType,
      overall_completion,
      checkride_ready,
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      areas_of_operation: processedAreas,
    })

  } catch (error) {
    console.error("Error in ACS progress API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is an instructor or admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["instructor", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { student_id, acs_task_id, proficiency_level, notes } = body

    if (!student_id || !acs_task_id || proficiency_level === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Upsert student ACS progress
    const { data, error } = await supabase
      .from("student_acs_progress")
      .upsert({
        student_id,
        acs_task_id,
        proficiency_level,
        evaluator_id: user.id,
        notes: notes || null,
        last_evaluated: new Date().toISOString(),
      }, {
        onConflict: "student_id,acs_task_id"
      })
      .select()

    if (error) {
      console.error("Error updating ACS progress:", error)
      return NextResponse.json(
        { error: "Failed to update progress" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error("Error in ACS progress POST:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 