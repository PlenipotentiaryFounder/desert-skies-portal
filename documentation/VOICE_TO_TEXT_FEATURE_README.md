# Voice-to-Text Transcription Feature

## Overview
The voice-to-text feature allows users to record audio responses during AI mock oral sessions and automatically transcribe them using OpenAI's Whisper API. The transcribed text is then saved to the database for later review and analysis.

## Current Working Implementation

### 1. Audio Recording Workflow
```
User clicks mic button → Permission granted → Start recording → Audio visualization shows activity → Stop recording → Audio blob created → Automatic transcription → Text appears below input bar
```

### 2. Key Components

#### `hooks/use-recorder.ts`
- **Purpose**: Manages microphone access, audio recording, and blob creation
- **Key Features**:
  - Uses `MediaRecorder` API for audio capture
  - Creates audio visualization using `AudioContext` and `AnalyserNode`
  - Handles audio blob creation in `onstop` event
  - Manages cleanup timing to ensure blob is created before cleanup

#### `components/MicRecorder/OpenAIStyleInput.tsx` (NEW)
- **Purpose**: Ultra-compact, OpenAI-style input bar that combines voice and text input
- **Key Features**:
  - Single-line input bar (~44px height when idle)
  - Integrated microphone button on the left
  - Send button on the right
  - Transcript appears below the bar after recording
  - Persistent audio consent (only ask once per user)
  - Minimal UI that feels invisible when not in use

#### `components/MicRecorder/CompactVoiceRecorder.tsx` (Legacy)
- **Purpose**: Previous compact voice recorder component
- **Status**: Replaced by OpenAIStyleInput for better UX

#### `components/MicRecorder/MicRecorderBox.tsx` (Legacy)
- **Purpose**: Original voice recorder component
- **Status**: Replaced by more compact designs

#### `lib/whisper-client.ts`
- **Purpose**: Handles communication with OpenAI Whisper API
- **Key Features**:
  - Supports primary and backup API keys
  - Handles different environments (browser vs server)
  - Returns structured response with text, confidence, and language

### 3. Database Integration

#### `lib/supabase/save-transcript.ts`
- **Purpose**: Saves transcribed audio to `mock_oral_transcripts` table
- **Schema**:
  ```sql
  - user_id (UUID)
  - session_id (UUID) 
  - question_id (UUID, nullable)
  - transcript (TEXT)
  - audio_duration_seconds (NUMERIC)
  - whisper_model_used (TEXT)
  - confidence_score (NUMERIC)
  - language_detected (TEXT)
  ```

#### `lib/supabase/user-preferences.ts` (NEW)
- **Purpose**: Manages user preferences including audio consent
- **Schema**:
  ```sql
  - user_id (UUID)
  - audio_consent_granted (BOOLEAN)
  - audio_consent_granted_at (TIMESTAMP)
  - audio_consent_revoked_at (TIMESTAMP)
  ```

### 4. Critical Fixes Applied

#### Fix 1: Audio Visualization Stale Closure
**Problem**: Audio visualization wasn't updating because of stale closure in `updateAudioLevel`
**Solution**: Removed `state.isRecording` check from the animation frame loop

#### Fix 2: Audio Blob Creation Timing
**Problem**: `cleanup()` was called immediately after `mediaRecorder.stop()`, clearing chunks before blob creation
**Solution**: Moved `cleanup()` to happen after blob creation in the `onstop` event

#### Fix 3: Component State Management
**Problem**: Component was using polling to wait for audio blob state updates
**Solution**: Used `useEffect` to react to `audioBlob` state changes directly

#### Fix 4: QuestionId Validation
**Problem**: Database was receiving `"unknown"` or `null` for questionId
**Solution**: Added conditional rendering to only show voice recorder when `currentQuestionId` is available

#### Fix 5: Persistent Audio Consent (NEW)
**Problem**: Users had to grant microphone permission every question
**Solution**: Added user preferences table to store consent and only ask once per user

### 5. Current Workflow Steps

1. **Permission Check**: Check if user has already granted audio consent
2. **Start Recording**: Click mic button → `MediaRecorder` begins capturing audio with 100ms chunks
3. **Audio Visualization**: Real-time audio level display using `AnalyserNode`
4. **Stop Recording**: Click stop button → `mediaRecorder.stop()` triggers `onstop` event
5. **Blob Creation**: Audio chunks are combined into a single blob
6. **State Update**: `audioBlob` is set in component state
7. **Automatic Transcription**: `useEffect` detects blob and calls Whisper API
8. **Text Display**: Transcribed text appears below the input bar
9. **Use Transcript**: Click "Use" to populate input field with transcript
10. **Submit**: Click "Send" to submit answer

### 6. UI Design Philosophy

#### OpenAI-Style Compact Design
- **Single-line input bar** (~44px height when idle)
- **Integrated microphone button** on the left side
- **Send button** on the right side
- **Transcript appears below** the input bar after recording
- **Minimal visual footprint** - feels invisible when not in use
- **Persistent consent** - only ask for microphone permission once per user

#### Space Optimization
- **60-70% more space** for conversation interface and ACS navigation
- **Removed redundant UI elements** like "Show Voice Recorder" button
- **Condensed navigation controls** with shorter text
- **Reduced margins and padding** throughout the interface

### 7. Environment Variables Required

```env
# Primary OpenAI API Key (server-side)
OPENAI_API_KEY=sk-...

# Backup OpenAI API Key (server-side fallback)
BACKUP_OPENAI_API_KEY=sk-...

# Do NOT set NEXT_PUBLIC_* OpenAI keys. Client calls server proxy at /api/whisper/transcribe
```

### 8. Usage in Components

```tsx
import OpenAIStyleInput from '@/components/MicRecorder/OpenAIStyleInput';

// In your component
<OpenAIStyleInput
  userId={userId}
  sessionId={sessionId}
  questionId={questionId}
  onTranscriptReady={handleTranscriptReady}
  onTranscriptSaved={handleTranscriptSaved}
  onSubmit={handleSubmitAnswer}
  placeholder="Type your answer..."
/>
```

### 9. Migration from Legacy Components

The new `OpenAIStyleInput` component replaces:
- `MicRecorderBox` (original bulky component)
- `CompactVoiceRecorder` (previous compact version)
- Separate text input and voice recorder sections

All functionality is preserved while providing a much more compact and user-friendly interface.

### 10. VoiceEnabledTextarea Wrapper (Concept)

A reusable wrapper to standardize mic-enabled text inputs across forms (e.g., Gouge Feedback fields):

- Combines Label + Textarea + Mic trigger + inline `OpenAIStyleInput` panel.
- Props: `label`, `name`, `placeholder`, `value`, `onChange`, and `onTranscript` (append/replace).
- Benefits: Consistent UX and less duplicated mic integration code.

Example usage:

```tsx
<VoiceEnabledTextarea
  label="Gotcha Questions"
  name="step4.gotcha_questions"
  value={form.watch('step4.gotcha_questions')}
  onChange={(v) => form.setValue('step4.gotcha_questions', v)}
  onTranscript={(t) => form.setValue('step4.gotcha_questions', `${form.watch('step4.gotcha_questions') || ''} ${t}`.trim())}
  placeholder="Any tricky or 'gotcha' questions?"
/>
```