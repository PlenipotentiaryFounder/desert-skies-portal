"use client"

import { EnhancedMissionForm } from "./enhanced-mission-form"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface EnhancedMissionFormClientProps {
  enrollments: any[]
  lessons: any[]
  maneuvers: any[]
  initialValues?: any
}

export function EnhancedMissionFormClient({ 
  enrollments, 
  lessons, 
  maneuvers, 
  initialValues 
}: EnhancedMissionFormClientProps) {
  const router = useRouter()
  const { toast } = useToast()

  async function handleCreateMission(formData: any) {
    try {
      const response = await fetch("/api/instructor/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create mission")
      }

      toast({
        title: "Mission Created!",
        description: `Mission ${result.data.mission_code} has been created successfully.`,
      })

      // Redirect to mission detail page
      router.push(`/instructor/missions/${result.data.id}`)
    } catch (error: any) {
      console.error("Error creating mission:", error)
      
      toast({
        title: "Error",
        description: error.message || "Failed to create mission",
        variant: "destructive",
      })
      
      throw error
    }
  }

  return (
    <EnhancedMissionForm
      enrollments={enrollments}
      lessons={lessons}
      maneuvers={maneuvers}
      initialValues={initialValues}
      onSubmit={handleCreateMission}
    />
  )
}

