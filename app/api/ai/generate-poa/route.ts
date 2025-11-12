import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(await cookies())
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { transcript, lessonId, studentId } = await request.json()

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 })
    }

    // Get lesson details
    let lessonContext = ""
    if (lessonId) {
      const { data: lesson } = await supabase
        .from('syllabus_lessons')
        .select('title, description, objective, maneuvers(*)')
        .eq('id', lessonId)
        .single()
      
      if (lesson) {
        lessonContext = `
Lesson: ${lesson.title}
Description: ${lesson.description}
Objectives: ${lesson.objective}
Maneuvers: ${lesson.maneuvers?.map((m: any) => m.name).join(', ')}
        `
      }
    }

    // Get student context if provided
    let studentContext = ""
    if (studentId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', studentId)
        .single()
      
      if (profile) {
        studentContext = `Student: ${profile.full_name}\n`
      }

      // Get recent debrief for context
      const { data: recentDebriefs } = await supabase
        .from('debriefs')
        .select('strengths, areas_for_improvement, instructor_notes')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (recentDebriefs && recentDebriefs.length > 0) {
        const debrief = recentDebriefs[0]
        studentContext += `
Previous Performance:
- Strengths: ${debrief.strengths}
- Areas for Improvement: ${debrief.areas_for_improvement}
- Notes: ${debrief.instructor_notes}
        `
      }
    }

    // In production, this would call OpenAI/Claude API
    // For now, we'll simulate AI generation with structured parsing
    const generatedPOA = await generatePOAFromTranscript(transcript, lessonContext, studentContext)

    return NextResponse.json({ poa: generatedPOA })
  } catch (error) {
    console.error("Error generating POA:", error)
    return NextResponse.json(
      { error: "Failed to generate Plan of Action" },
      { status: 500 }
    )
  }
}

// Simulated AI generation - in production, replace with actual AI API call
async function generatePOAFromTranscript(
  transcript: string, 
  lessonContext: string, 
  studentContext: string
) {
  // Parse key information from transcript
  const flightNumberMatch = transcript.match(/flight\s+(\d+)/i)
  const tailNumberMatch = transcript.match(/([N]\d{4,5}[A-Z]?)/i)
  const directionMatch = transcript.match(/(north|south|east|west|northeast|northwest|southeast|southwest)/i)
  
  // Extract destination/practice area
  const practiceAreaMatch = transcript.match(/(practice area|area|to\s+(\w+))/i)
  
  // Generate structured POA
  return {
    flight_number: flightNumberMatch ? flightNumberMatch[1] : "",
    tail_number: tailNumberMatch ? tailNumberMatch[1] : "",
    departure_direction: directionMatch ? directionMatch[1] : "",
    destination: practiceAreaMatch ? practiceAreaMatch[0] : "",
    mission_overview: transcript,
    training_objectives: extractObjectives(transcript, lessonContext),
    student_focus_notes: generateFocusNotes(transcript, studentContext),
    video_resources: suggestVideoResources(transcript),
    faa_references: suggestFARReferences(transcript),
    prep_checklist_items: generateChecklist(transcript),
    ai_metadata: {
      generated_at: new Date().toISOString(),
      model: "simulated-ai-v1",
      confidence: 0.85
    }
  }
}

function extractObjectives(transcript: string, lessonContext: string): string[] {
  // In production, use AI to extract and generate objectives
  const objectives = []
  
  // Look for maneuvers mentioned
  const maneuvers = [
    'steep turns', 'slow flight', 'stalls', 'power-off stalls', 'power-on stalls',
    'emergency descent', 'ground reference', 'turns around a point', 'S-turns',
    'traffic pattern', 'landing', 'takeoff', 'crosswind landing'
  ]
  
  maneuvers.forEach(maneuver => {
    if (transcript.toLowerCase().includes(maneuver)) {
      objectives.push(`Execute ${maneuver} to ACS standards`)
    }
  })
  
  // Add standard objectives
  objectives.push("Maintain situational awareness and proper clearing procedures")
  objectives.push("Demonstrate effective crew resource management")
  
  return objectives
}

function generateFocusNotes(transcript: string, studentContext: string): string {
  // In production, AI would analyze student history and generate personalized notes
  if (studentContext.includes("Areas for Improvement")) {
    return "Focus on areas identified in previous debrief. Emphasize smooth control inputs and maintaining situational awareness."
  }
  
  return "Monitor student's performance and provide real-time feedback. Emphasize safety and adherence to ACS standards."
}

function suggestVideoResources(transcript: string): Array<{ title: string; url: string }> {
  const resources = []
  
  if (transcript.toLowerCase().includes('steep turn')) {
    resources.push({
      title: "Mastering Steep Turns",
      url: "https://youtube.com/watch?v=example1"
    })
  }
  
  if (transcript.toLowerCase().includes('stall')) {
    resources.push({
      title: "Stall Recognition and Recovery",
      url: "https://youtube.com/watch?v=example2"
    })
  }
  
  if (transcript.toLowerCase().includes('slow flight')) {
    resources.push({
      title: "Slow Flight Technique",
      url: "https://youtube.com/watch?v=example3"
    })
  }
  
  return resources
}

function suggestFARReferences(transcript: string): Array<{ section: string; description: string }> {
  const references = []
  
  // Common FAR references for flight training
  references.push({
    section: "61.87",
    description: "Solo flight requirements for student pilots"
  })
  
  references.push({
    section: "91.119",
    description: "Minimum safe altitudes"
  })
  
  if (transcript.toLowerCase().includes('airspace')) {
    references.push({
      section: "91.155",
      description: "VFR weather minimums"
    })
  }
  
  return references
}

function generateChecklist(transcript: string): string[] {
  const checklist = [
    "Review weather conditions and forecasts",
    "Check NOTAMs for practice area",
    "Verify aircraft airworthiness",
    "Brief emergency procedures",
    "Review airspace boundaries and restrictions"
  ]
  
  if (transcript.toLowerCase().includes('cross-country') || transcript.toLowerCase().includes('destination')) {
    checklist.push("File flight plan if required")
    checklist.push("Review route and alternate airports")
  }
  
  checklist.push("Confirm student has current medical certificate")
  checklist.push("Review lesson objectives with student")
  
  return checklist
}
