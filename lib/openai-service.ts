import OpenAI from 'openai'

// Initialize OpenAI client only when needed
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface POAGenerationRequest {
  missionType: 'F' | 'G' | 'S' // Flight, Ground, Simulator
  lessonTitle: string
  lessonDescription?: string
  acsStandards?: string[]
  studentName: string
  studentLevel: string // e.g., "Private Pilot", "Commercial Pilot"
  previousLessons?: string[]
  studentWeaknesses?: string[]
  aircraftType?: string
  weather?: string
  additionalContext?: string
}

export interface POAGenerationResponse {
  objectives: string[]
  preflight_briefing: string
  ground_lesson?: string
  flight_maneuvers?: string[]
  completion_standards: string[]
  safety_considerations: string[]
  common_errors: string[]
  instructor_notes: string
  estimated_duration: {
    ground: number // minutes
    flight: number // minutes
  }
}

export interface DebriefAnalysisRequest {
  transcription: string
  missionType: 'F' | 'G' | 'S'
  plannedObjectives: string[]
  studentName: string
}

export interface DebriefAnalysisResponse {
  summary: string
  objectives_completed: string[]
  objectives_partial: string[]
  objectives_not_met: string[]
  student_strengths: string[]
  areas_for_improvement: string[]
  maneuver_scores: Array<{
    maneuver: string
    score: number
    notes: string
  }>
  instructor_observations: string
  recommended_next_steps: string[]
}

/**
 * Generate a comprehensive Plan of Action for a training mission using OpenAI
 */
export async function generatePlanOfAction(
  request: POAGenerationRequest
): Promise<POAGenerationResponse> {
  const missionTypeLabel = 
    request.missionType === 'F' ? 'Flight' :
    request.missionType === 'G' ? 'Ground' :
    'Simulator'

  const prompt = `You are an experienced FAA-certified flight instructor creating a detailed Plan of Action (POA) for a flight training mission.

**Mission Details:**
- Type: ${missionTypeLabel}
- Lesson: ${request.lessonTitle}
${request.lessonDescription ? `- Description: ${request.lessonDescription}` : ''}
${request.aircraftType ? `- Aircraft: ${request.aircraftType}` : ''}
- Student: ${request.studentName} (${request.studentLevel})
${request.acsStandards ? `- ACS Standards: ${request.acsStandards.join(', ')}` : ''}
${request.previousLessons ? `- Previous Lessons: ${request.previousLessons.join(', ')}` : ''}
${request.studentWeaknesses ? `- Student Weaknesses: ${request.studentWeaknesses.join(', ')}` : ''}
${request.weather ? `- Weather: ${request.weather}` : ''}
${request.additionalContext ? `- Additional Context: ${request.additionalContext}` : ''}

Create a comprehensive, student-focused Plan of Action that includes:

1. **Lesson Objectives** (3-5 specific, measurable objectives)
2. **Preflight Briefing** (What to cover before the ${missionTypeLabel.toLowerCase()})
${request.missionType === 'G' ? '3. **Ground Lesson Plan** (Detailed lesson structure with topics and activities)' : ''}
${request.missionType !== 'G' ? '3. **Flight/Simulator Maneuvers** (List of maneuvers to practice, in logical order)' : ''}
4. **Completion Standards** (Based on FAA ACS, what the student must demonstrate)
5. **Safety Considerations** (Key safety points specific to this lesson)
6. **Common Errors** (Typical mistakes students make in this lesson and how to correct them)
7. **Instructor Notes** (Tips for effective instruction, areas requiring extra emphasis)
8. **Estimated Duration** (Ground and ${missionTypeLabel.toLowerCase()} time in minutes)

Be specific, practical, and ensure the POA follows FAA standards and best practices for flight instruction.

Return the response as a valid JSON object matching this structure:
{
  "objectives": ["string"],
  "preflight_briefing": "string",
  ${request.missionType === 'G' ? '"ground_lesson": "string",' : ''}
  ${request.missionType !== 'G' ? '"flight_maneuvers": ["string"],' : ''}
  "completion_standards": ["string"],
  "safety_considerations": ["string"],
  "common_errors": ["string"],
  "instructor_notes": "string",
  "estimated_duration": {
    "ground": number,
    "flight": number
  }
}`

  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Using GPT-4o for high-quality, structured output
      messages: [
        {
          role: 'system',
          content: 'You are an expert FAA-certified flight instructor with 20+ years of experience. You create detailed, practical Plans of Action that help students succeed. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    const result = JSON.parse(content)
    return result as POAGenerationResponse
  } catch (error) {
    console.error('Error generating POA with OpenAI:', error)
    throw new Error('Failed to generate Plan of Action')
  }
}

/**
 * Analyze a post-flight debrief transcription using OpenAI
 */
export async function analyzeDebriefTranscription(
  request: DebriefAnalysisRequest
): Promise<DebriefAnalysisResponse> {
  const missionTypeLabel = 
    request.missionType === 'F' ? 'Flight' :
    request.missionType === 'G' ? 'Ground' :
    'Simulator'

  const prompt = `You are an experienced FAA-certified flight instructor analyzing a post-${missionTypeLabel.toLowerCase()} debrief conversation.

**Mission Details:**
- Type: ${missionTypeLabel}
- Student: ${request.studentName}
- Planned Objectives: ${request.plannedObjectives.join(', ')}

**Debrief Transcription:**
${request.transcription}

Analyze this debrief and provide:

1. **Summary** (2-3 sentences overview of the session)
2. **Objectives Status** (Which objectives were completed, partially completed, or not met)
3. **Student Strengths** (What the student did well)
4. **Areas for Improvement** (What needs work)
5. **Maneuver Scores** (If applicable, extract any mentioned maneuvers with scores 1-4 based on ACS standards)
6. **Instructor Observations** (Key teaching points and observations)
7. **Recommended Next Steps** (What should be practiced next)

Return the response as a valid JSON object matching this structure:
{
  "summary": "string",
  "objectives_completed": ["string"],
  "objectives_partial": ["string"],
  "objectives_not_met": ["string"],
  "student_strengths": ["string"],
  "areas_for_improvement": ["string"],
  "maneuver_scores": [{"maneuver": "string", "score": number, "notes": "string"}],
  "instructor_observations": "string",
  "recommended_next_steps": ["string"]
}`

  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert FAA-certified flight instructor analyzing post-flight debriefs. You provide constructive, specific feedback that helps students improve. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('No content returned from OpenAI')
    }

    const result = JSON.parse(content)
    return result as DebriefAnalysisResponse
  } catch (error) {
    console.error('Error analyzing debrief with OpenAI:', error)
    throw new Error('Failed to analyze debrief')
  }
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const openai = getOpenAI()
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    })

    return transcription as unknown as string
  } catch (error) {
    console.error('Error transcribing audio with Whisper:', error)
    throw new Error('Failed to transcribe audio')
  }
}

/**
 * Transcribe audio from a base64-encoded string
 */
export async function transcribeAudioBase64(
  audioBase64: string,
  filename: string = 'audio.webm'
): Promise<string> {
  try {
    // Convert base64 to Blob
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
    const audioFile = new File([audioBlob], filename, { type: 'audio/webm' })

    return await transcribeAudio(audioFile)
  } catch (error) {
    console.error('Error transcribing base64 audio:', error)
    throw new Error('Failed to transcribe audio')
  }
}


