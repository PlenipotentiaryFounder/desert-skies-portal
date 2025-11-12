import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient(await cookies())
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const syllabusId = searchParams.get('syllabusId')

    if (!studentId || !syllabusId) {
      return NextResponse.json(
        { error: "studentId and syllabusId are required" },
        { status: 400 }
      )
    }

    // Get student's current progress
    const { data: enrollment } = await supabase
      .from('student_enrollments')
      .select('current_lesson_index')
      .eq('student_id', studentId)
      .eq('syllabus_id', syllabusId)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })
    }

    // Get student's lesson progress
    const { data: lessonProgress } = await supabase
      .from('student_lesson_progress')
      .select('lesson_id, proficiency_level, completion_status')
      .eq('student_id', studentId)

    // Get student's maneuver performance
    const { data: maneuverScores } = await supabase
      .from('maneuver_scores')
      .select('maneuver_id, score, flight_session:flight_sessions(session_date)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get recent debriefs
    const { data: debriefs } = await supabase
      .from('debriefs')
      .select('areas_for_improvement, strengths')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Generate recommendations based on data
    const recommendations = await generateRecommendations({
      enrollment,
      lessonProgress: lessonProgress || [],
      maneuverScores: maneuverScores || [],
      debriefs: debriefs || []
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    )
  }
}

interface RecommendationData {
  enrollment: any
  lessonProgress: any[]
  maneuverScores: any[]
  debriefs: any[]
}

async function generateRecommendations(data: RecommendationData) {
  const recommendations = []

  // Analyze proficiency levels
  const developingLessons = data.lessonProgress.filter(
    p => p.proficiency_level === 'developing' && p.completion_status !== 'completed'
  )

  if (developingLessons.length > 0) {
    recommendations.push({
      type: 'practice',
      priority: 'high',
      title: 'Additional Practice Recommended',
      description: `${developingLessons.length} lesson(s) show developing proficiency. Consider additional practice sessions to build confidence.`,
      action: 'Schedule review flight',
      icon: 'target'
    })
  }

  // Analyze maneuver performance
  const recentManeuverScores = data.maneuverScores.slice(0, 10)
  const lowScores = recentManeuverScores.filter(s => s.score < 3)
  
  if (lowScores.length > 3) {
    const uniqueManeuvers = new Set(lowScores.map(s => s.maneuver_id))
    recommendations.push({
      type: 'focus_area',
      priority: 'high',
      title: 'Maneuvers Needing Attention',
      description: `${uniqueManeuvers.size} maneuver(s) consistently scoring below proficient. Targeted practice recommended.`,
      action: 'Review maneuver techniques',
      icon: 'alert'
    })
  }

  // Analyze debrief patterns
  const commonImprovements = extractCommonThemes(
    data.debriefs.map(d => d.areas_for_improvement).filter(Boolean)
  )

  if (commonImprovements.length > 0) {
    recommendations.push({
      type: 'improvement',
      priority: 'medium',
      title: 'Recurring Areas for Improvement',
      description: `Instructors have noted: ${commonImprovements.join(', ')}. Focused attention on these areas will accelerate progress.`,
      action: 'Review instructor notes',
      icon: 'lightbulb'
    })
  }

  // Check for strengths to build on
  const strengths = extractCommonThemes(
    data.debriefs.map(d => d.strengths).filter(Boolean)
  )

  if (strengths.length > 0) {
    recommendations.push({
      type: 'strength',
      priority: 'low',
      title: 'Areas of Strength',
      description: `You're excelling at: ${strengths.join(', ')}. Continue building on these skills!`,
      action: 'Maintain current approach',
      icon: 'award'
    })
  }

  // Progression recommendation
  const completedLessons = data.lessonProgress.filter(
    p => p.completion_status === 'completed'
  ).length

  if (completedLessons >= 5) {
    recommendations.push({
      type: 'milestone',
      priority: 'low',
      title: 'Progress Milestone',
      description: `You've completed ${completedLessons} lessons! Keep up the excellent work.`,
      action: 'Continue to next lesson',
      icon: 'trophy'
    })
  }

  // Add general recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'general',
      priority: 'low',
      title: 'On Track',
      description: 'Your training is progressing well. Continue working through your syllabus systematically.',
      action: 'Continue training',
      icon: 'check'
    })
  }

  return recommendations
}

function extractCommonThemes(texts: string[]): string[] {
  // In production, use NLP to extract themes
  // For now, simple keyword extraction
  const keywords = new Map<string, number>()
  
  const commonTerms = [
    'altitude control', 'airspeed control', 'coordination', 'situational awareness',
    'communication', 'checklist usage', 'decision making', 'smoothness',
    'heading control', 'trim usage', 'clearing turns', 'traffic pattern'
  ]
  
  texts.forEach(text => {
    if (!text) return
    const lowerText = text.toLowerCase()
    commonTerms.forEach(term => {
      if (lowerText.includes(term)) {
        keywords.set(term, (keywords.get(term) || 0) + 1)
      }
    })
  })
  
  // Return terms mentioned 2+ times
  return Array.from(keywords.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([term]) => term)
}

