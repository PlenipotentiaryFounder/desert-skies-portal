"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface LessonNavigationKeyboardProps {
  syllabusId: string
  previousLessonId: string | null
  nextLessonId: string | null
}

export function LessonNavigationKeyboard({ 
  syllabusId, 
  previousLessonId, 
  nextLessonId 
}: LessonNavigationKeyboardProps) {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return
      }

      // Left arrow = previous lesson
      if (event.key === "ArrowLeft" && previousLessonId) {
        event.preventDefault()
        router.push(`/instructor/syllabi/${syllabusId}/lessons/${previousLessonId}`)
      }

      // Right arrow = next lesson
      if (event.key === "ArrowRight" && nextLessonId) {
        event.preventDefault()
        router.push(`/instructor/syllabi/${syllabusId}/lessons/${nextLessonId}`)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [syllabusId, previousLessonId, nextLessonId, router])

  return null // This component doesn't render anything
}

