# Plan of Action Generation - Feature Specification

## Overview
The Plan of Action (POA) is a pre-mission briefing document that instructors create before each training flight. The system should help instructors create comprehensive, AI-enhanced POAs by providing context, voice transcription, and intelligent suggestions.

## User Story
As an instructor creating a mission, after selecting the lesson and scheduling the time, I want to create a detailed Plan of Action by speaking into my microphone while viewing the lesson objectives, maneuvers, and student's training history, so that the AI can generate a comprehensive pre-mission briefing document tailored to this specific student's needs.

## Current State
- POA generation exists but is triggered as a checkbox on the Review step
- No instructor input or context provided
- Generic POA generation without student-specific history

## Proposed Flow

### Step 4: Create Plan of Action (New)
This becomes a dedicated step between "Schedule" (Step 3) and "Review" (Step 5).

#### UI Layout

```
┌─────────────────────────────────────────────────────┐
│ Step 4: Plan of Action                               │
│━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│
│                                                      │
│ ┌────────────────┐  ┌─────────────────────────────┐│
│ │ LESSON INFO    │  │ INSTRUCTOR BRIEFING         ││
│ │                │  │                             ││
│ │ Lesson 5:      │  │ 🎤 [Record Button]          ││
│ │ Traffic Patterns│  │                             ││
│ │                │  │ Status: Ready to record     ││
│ │ Objectives:    │  │                             ││
│ │ • Master...    │  │ [Transcription appears here]││
│ │ • Execute...   │  │                             ││
│ │                │  │                             ││
│ │ Maneuvers:     │  │                             ││
│ │ □ Takeoff      │  │                             ││
│ │ □ Pattern Work │  │                             ││
│ │ □ Landing      │  │                             ││
│ │                │  │                             ││
│ │ Standards:     │  │                             ││
│ │ • Altitude ±100'│  │                             ││
│ │ • Speed ±10 kts│  │                             ││
│ └────────────────┘  └─────────────────────────────┘│
│                                                      │
│ ┌──────────────────────────────────────────────────┐│
│ │ STUDENT TRAINING HISTORY                         ││
│ │                                                  ││
│ │ Previous Lesson (Lesson 4):                     ││
│ │ • Struggled with flare timing                   ││
│ │ • Excellent crosswind technique                 ││
│ │ • Needs practice with radio calls              ││
│ │                                                  ││
│ │ Recent Feedback:                                 ││
│ │ "Great progress on steep turns..."              ││
│ └──────────────────────────────────────────────────┘│
│                                                      │
│ [← Back]              [Skip POA] [Generate POA →]   │
└─────────────────────────────────────────────────────┘
```

## Technical Requirements

### 1. Audio Recording
- **Web Audio API** or similar for browser-based microphone access
- Real-time audio capture
- Support pause/resume functionality
- Visual waveform indicator (optional but nice)

```typescript
interface AudioRecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  audioBlob: Blob | null
}
```

### 2. Transcription Service
- **OpenAI Whisper API** for speech-to-text
- Send audio blob to backend
- Stream transcription back to UI (if possible)
- Display transcribed text in real-time

```typescript
async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('audio', audioBlob)
  
  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData
  })
  
  return await response.text()
}
```

### 3. Context Gathering

#### A. Lesson Context
Pull from `syllabus_lessons` table:
- Lesson title & description
- Objectives
- Performance standards
- Maneuvers (from `lesson_maneuvers` join)
- Completion standards

#### B. Student History
Pull from multiple sources:
1. **Previous Mission Debriefs** (`missions` → `plan_of_action` / `debrief_notes`)
   - Last 3-5 missions
   - Focus on post-brief notes
   - Instructor feedback

2. **Maneuver Scores** (`maneuver_scores`)
   - Recent proficiency levels
   - Struggling areas (score < 3)
   - Strong areas (score >= 4)

3. **ACS Progress** (`student_acs_progress`)
   - Tasks marked as weak
   - Areas needing emphasis

4. **Flight Log Entries** (`flight_log_entries`)
   - Total hours
   - Recent flight frequency
   - Time since last flight

### 4. AI POA Generation

#### OpenAI Prompt Structure
```
You are an experienced flight instructor creating a Plan of Action for an upcoming training mission.

LESSON INFORMATION:
Title: {lesson.title}
Objectives: {lesson.objectives}
Maneuvers: {lesson.maneuvers}
Performance Standards: {lesson.performance_standards}

STUDENT BACKGROUND:
Name: {student.name}
Total Hours: {student.total_hours}
Recent Training History:
{previous_debriefs}

Maneuver Proficiency:
{maneuver_scores}

INSTRUCTOR BRIEFING NOTES:
{transcribed_instructor_input}

Please create a detailed Plan of Action that includes:
1. Pre-flight briefing topics
2. Specific maneuvers to practice (with emphasis based on student history)
3. Common mistakes to watch for (based on previous feedback)
4. Success criteria for this mission
5. Recommended study materials or videos
6. Safety considerations
7. Post-flight discussion topics

Tailor this specifically to this student's strengths and weaknesses.
```

#### Response Format
Return structured POA with sections:
```typescript
interface PlanOfAction {
  id: string
  mission_id: string
  generated_by: 'ai' | 'manual' | 'hybrid'
  
  // Core sections
  overview: string
  pre_flight_briefing: string[]
  maneuvers_to_practice: ManeuverPlan[]
  common_mistakes: string[]
  success_criteria: string[]
  recommended_resources: Resource[]
  safety_considerations: string[]
  post_flight_topics: string[]
  
  // Metadata
  instructor_notes: string  // The transcribed input
  ai_prompt: string
  ai_model: string
  created_at: string
}

interface ManeuverPlan {
  maneuver_name: string
  emphasis_level: 'high' | 'medium' | 'low'
  reason: string  // Why this emphasis based on history
  tips: string[]
}

interface Resource {
  type: 'video' | 'document' | 'article' | 'faa_resource'
  title: string
  url: string
  description: string
}
```

## UI Components Needed

### 1. Audio Recorder Component
```typescript
interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, transcript: string) => void
  onTranscriptUpdate?: (partialTranscript: string) => void
}
```

Features:
- Start/Stop/Pause buttons
- Timer display
- Waveform visualization (optional)
- Playback capability
- Re-record button

### 2. Lesson Context Sidebar
```typescript
interface LessonContextProps {
  lesson: SyllabusLesson
  maneuvers: Maneuver[]
  showCheckboxes?: boolean
}
```

Displays:
- Lesson title & objectives
- Maneuver checklist
- Performance standards
- Completion criteria

### 3. Student History Panel
```typescript
interface StudentHistoryProps {
  studentId: string
  enrollmentId: string
  limit?: number  // How many previous missions to show
}
```

Displays:
- Recent mission feedback
- Maneuver proficiency chart
- Areas of concern
- Strong points

### 4. POA Preview/Editor
```typescript
interface POAPreviewProps {
  poa: PlanOfAction
  onEdit: (section: keyof PlanOfAction, newValue: any) => void
  editable?: boolean
}
```

Features:
- Collapsible sections
- Inline editing
- Print/PDF export
- Share with student button

## API Endpoints

### 1. POST /api/transcribe
```typescript
// Request: multipart/form-data with audio file
// Response: { transcript: string }
```

### 2. POST /api/plan-of-action/generate
```typescript
interface GeneratePOARequest {
  mission_id: string
  lesson_id: string
  student_id: string
  instructor_notes: string  // Transcribed input
  context?: {
    include_history: boolean
    history_depth: number  // How many previous missions
  }
}

interface GeneratePOAResponse {
  success: boolean
  data?: PlanOfAction
  error?: string
}
```

### 3. GET /api/students/[id]/training-context
```typescript
interface TrainingContextResponse {
  recent_missions: Mission[]
  maneuver_scores: ManeuverScore[]
  acs_progress: ACSProgress[]
  total_flight_hours: number
  days_since_last_flight: number
}
```

## Database Schema Updates

### plan_of_actions Table
```sql
CREATE TABLE plan_of_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('ai', 'manual', 'hybrid')),
  
  -- Core content
  overview TEXT,
  pre_flight_briefing JSONB,  -- Array of strings
  maneuvers_to_practice JSONB,  -- Array of ManeuverPlan objects
  common_mistakes JSONB,
  success_criteria JSONB,
  recommended_resources JSONB,
  safety_considerations JSONB,
  post_flight_topics JSONB,
  
  -- Input/metadata
  instructor_notes TEXT,  -- Transcribed input
  ai_prompt TEXT,
  ai_model TEXT,
  ai_processing_time_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Student can acknowledge reading it
  student_acknowledged_at TIMESTAMPTZ,
  
  UNIQUE(mission_id)  -- One POA per mission
);
```

## Implementation Phases

### Phase 1: Basic POA Step (2-3 days)
- [ ] Add Step 4 to mission form
- [ ] Create basic layout with lesson info sidebar
- [ ] Simple text input for instructor notes (no audio yet)
- [ ] Generate basic AI POA from text input
- [ ] Move Review to Step 5

### Phase 2: Audio Recording (2-3 days)
- [ ] Implement audio recorder component
- [ ] Add Whisper API transcription
- [ ] Real-time transcription display
- [ ] Playback functionality

### Phase 3: Smart Context (3-4 days)
- [ ] Build student history panel
- [ ] Create training context API
- [ ] Pull previous debriefs
- [ ] Display maneuver proficiency
- [ ] Show ACS weak areas

### Phase 4: Enhanced AI (2-3 days)
- [ ] Improve AI prompt with full context
- [ ] Add resource recommendations
- [ ] Maneuver emphasis based on history
- [ ] Video/article suggestions

### Phase 5: Polish (2-3 days)
- [ ] POA preview/edit UI
- [ ] PDF export
- [ ] Email/share with student
- [ ] Student acknowledgment feature
- [ ] Mobile-responsive design

**Total Estimated Time: 11-16 days**

## Future Enhancements

1. **Voice Commands**
   - "Add maneuver steep turns"
   - "Emphasize crosswind landings"
   - "Reference previous lesson"

2. **Template Library**
   - Save favorite POA structures
   - Share templates with other instructors
   - School-wide standard templates

3. **Student Preparation**
   - Send POA 24 hours before mission
   - Student can add questions/concerns
   - Pre-flight quiz based on POA

4. **Analytics**
   - Track which POA elements correlate with success
   - Identify most effective briefing strategies
   - Compare instructor POA styles

5. **Multi-language Support**
   - Transcribe in multiple languages
   - Generate POA in student's preferred language

---

**Status**: Documented - Ready for Implementation
**Priority**: High - Core Training Feature
**Dependencies**: OpenAI API (Whisper + GPT-4), Web Audio API
**Estimated LOC**: ~2000-3000 lines (components + services + API)

