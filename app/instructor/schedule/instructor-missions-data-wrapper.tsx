"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { InstructorMissionsList } from './instructor-missions-list'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface Mission {
  id: string
  mission_code: string
  mission_type: string
  scheduled_date: string
  scheduled_start_time: string | null
  status: string
  lesson_code: string | null
  plan_of_action_id: string | null
  student: {
    id: string
    first_name: string
    last_name: string
    email: string
    avatar_url: string | null
  } | null
  aircraft: {
    id: string
    tail_number: string
    make: string
    model: string
  } | null
  lesson_template: {
    id: string
    title: string
    description: string
    lesson_type: string
  } | null
  plan_of_action: {
    id: string
    status: string
    shared_with_student_at: string | null
    student_acknowledged_at: string | null
  } | null
}

export function InstructorMissionsDataWrapper() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMissions()
  }, [])

  async function fetchMissions() {
    try {
      setLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('missions')
        .select(`
          *,
          student:profiles!student_id(id, first_name, last_name, email, avatar_url),
          scheduled_aircraft:aircraft!scheduled_aircraft_id(id, tail_number, make, model),
          actual_aircraft:aircraft!actual_aircraft_id(id, tail_number, make, model),
          lesson_template:syllabus_lessons!lesson_template_id(id, title, description, lesson_type),
          plan_of_action:plans_of_action!plan_of_action_id(id, status, shared_with_student_at, student_acknowledged_at)
        `)
        .eq('assigned_instructor_id', user.id)
        .in('status', ['scheduled', 'in_progress'])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_start_time', { ascending: true })

      if (fetchError) throw fetchError

      setMissions(data || [])
    } catch (err) {
      console.error('Error fetching missions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load missions')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">Error loading missions</p>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    )
  }

  return <InstructorMissionsList missions={missions} />
}

