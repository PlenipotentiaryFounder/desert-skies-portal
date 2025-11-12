"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mic, StopCircle, Play, Pause, Download, Trash2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface VoiceRecorderProps {
  onRecordingComplete: (transcript: string, duration: number) => void
}

export function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const { toast } = useToast()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcribing, setTranscribing] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioBlob(audioBlob)
        setAudioUrl(url)
        
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setIsPaused(false)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast({
        title: "Recording Started",
        description: "Voice recording in progress",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Error",
        description: "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      toast({
        title: "Recording Stopped",
        description: `Duration: ${formatTime(recordingTime)}`,
      })
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
        
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1)
        }, 1000)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
        
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }

  const playAudio = () => {
    if (audioUrl && audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause()
        setIsPlaying(false)
      } else {
        audioElementRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setRecordingTime(0)
    setIsPlaying(false)
  }

  const downloadRecording = () => {
    if (audioUrl) {
      const a = document.createElement('a')
      a.href = audioUrl
      a.download = `debrief-${Date.now()}.webm`
      a.click()
    }
  }

  const transcribeAudio = async () => {
    if (!audioBlob) return

    setTranscribing(true)
    try {
      // This is a placeholder for actual transcription
      // In production, you would send the audio to a transcription service
      // like OpenAI Whisper, Google Speech-to-Text, etc.
      
      const formData = new FormData()
      formData.append('audio', audioBlob)

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok && result.transcript) {
        onRecordingComplete(result.transcript, recordingTime)
        toast({
          title: "Transcription Complete",
          description: "Voice recording has been transcribed",
        })
      } else {
        // Fallback: use placeholder text
        const placeholderTranscript = `[Voice recording ${formatTime(recordingTime)}] - Transcription will be available when AI transcription service is configured.`
        onRecordingComplete(placeholderTranscript, recordingTime)
        
        toast({
          title: "Recording Saved",
          description: "Audio saved. Configure transcription service for automatic transcription.",
        })
      }
    } catch (error) {
      console.error("Transcription error:", error)
      
      // Fallback: still allow proceeding with placeholder
      const placeholderTranscript = `[Voice recording ${formatTime(recordingTime)}] - Manual transcription needed.`
      onRecordingComplete(placeholderTranscript, recordingTime)
      
      toast({
        title: "Recording Saved",
        description: "Proceeding without transcription",
      })
    } finally {
      setTranscribing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          {/* Timer */}
          <div className="text-4xl font-mono font-bold">
            {formatTime(recordingTime)}
          </div>

          {/* Status */}
          <div className="flex items-center gap-2">
            {isRecording && !isPaused && (
              <Badge variant="destructive" className="animate-pulse">
                <Mic className="w-3 h-3 mr-1" />
                Recording
              </Badge>
            )}
            {isPaused && (
              <Badge variant="outline">
                Paused
              </Badge>
            )}
            {audioBlob && !isRecording && (
              <Badge variant="secondary">
                Recording Ready
              </Badge>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isRecording && !audioBlob && (
              <Button onClick={startRecording} size="lg">
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            )}

            {isRecording && (
              <>
                <Button onClick={pauseRecording} variant="outline" size="lg">
                  {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button onClick={stopRecording} variant="destructive" size="lg">
                  <StopCircle className="w-5 h-5 mr-2" />
                  Stop
                </Button>
              </>
            )}

            {audioBlob && !isRecording && (
              <>
                <Button onClick={playAudio} variant="outline" size="lg">
                  {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
                <Button onClick={downloadRecording} variant="outline" size="lg">
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>
                <Button onClick={deleteRecording} variant="destructive" size="lg">
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </Button>
                <Button 
                  onClick={transcribeAudio} 
                  disabled={transcribing}
                  size="lg"
                >
                  {transcribing ? "Transcribing..." : "Use Recording"}
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Hidden audio element for playback */}
      {audioUrl && (
        <audio
          ref={audioElementRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {/* Info */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription className="text-sm">
          Record your verbal debrief with the student. The recording will be automatically transcribed and can be used to generate an AI-formatted debrief.
        </AlertDescription>
      </Alert>
    </div>
  )
}

