"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getInitials } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface Instructor {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url: string | null
  student_count: number
}

export function ActiveInstructorsList() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchInstructors() {
      try {
        // Get instructors with active students
        const { data: instructorData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, avatar_url")
          .eq("role", "instructor")

        if (!instructorData) {
          setLoading(false)
          return
        }

        // For each instructor, count their active students
        const instructorsWithCounts = await Promise.all(
          instructorData.map(async (instructor) => {
            const { count } = await supabase
              .from("student_enrollments")
              .select("*", { count: "exact", head: true })
              .eq("instructor_id", instructor.id)
              .eq("status", "active")

            return {
              ...instructor,
              student_count: count || 0,
            }
          }),
        )

        // Sort by student count (descending)
        const sortedInstructors = instructorsWithCounts
          .sort((a, b) => b.student_count - a.student_count)
          .filter((instructor) => instructor.student_count > 0)
          .slice(0, 5)

        setInstructors(sortedInstructors)
      } catch (error) {
        console.error("Error fetching instructors:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInstructors()
  }, [supabase])

  if (loading) {
    return <div className="flex items-center justify-center h-[300px]">Loading instructor data...</div>
  }

  if (instructors.length === 0) {
    return <div className="flex items-center justify-center h-[300px]">No active instructors found</div>
  }

  return (
    <div className="space-y-4">
      {instructors.map((instructor) => (
        <div key={instructor.id} className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={instructor.avatar_url || undefined}
                alt={`${instructor.first_name} ${instructor.last_name}`}
              />
              <AvatarFallback>{getInitials(instructor.first_name, instructor.last_name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {instructor.first_name} {instructor.last_name}
              </div>
              <div className="text-sm text-muted-foreground">{instructor.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{instructor.student_count}</div>
              <div className="text-xs text-muted-foreground">Students</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push(`/admin/users/${instructor.id}`)}>
              View
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
