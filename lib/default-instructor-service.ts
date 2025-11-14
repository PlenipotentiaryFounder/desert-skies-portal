"use server"

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface InstructorInfo {
  id: string
  first_name: string
  last_name: string
  email: string
}

/**
 * Get the default instructor for new student enrollments
 * Tries to get Thomas Ferrier first, falls back to any active instructor
 */
export async function getDefaultInstructor(): Promise<InstructorInfo | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Try to get Thomas Ferrier (primary instructor)
  const { data: thomas, error: thomasError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('email', 'thomas@desertskiesaviationaz.com')
    .maybeSingle()
  
  if (thomas && !thomasError) {
    return thomas as InstructorInfo
  }
  
  // Fallback: Get any active instructor with the instructor role
  const { data: instructorRole } = await supabase
    .from('roles')
    .select('id')
    .eq('name', 'instructor')
    .single()
  
  if (!instructorRole) {
    console.error('No instructor role found in database')
    return null
  }
  
  const { data: instructorUsers } = await supabase
    .from('user_roles')
    .select(`
      profiles:user_id (
        id,
        first_name,
        last_name,
        email,
        status
      )
    `)
    .eq('role_id', instructorRole.id)
  
  // Find first active instructor
  const activeInstructor = instructorUsers?.find((iu: any) => 
    iu.profiles && iu.profiles.status === 'active'
  )
  
  if (activeInstructor && activeInstructor.profiles) {
    return {
      id: activeInstructor.profiles.id,
      first_name: activeInstructor.profiles.first_name,
      last_name: activeInstructor.profiles.last_name,
      email: activeInstructor.profiles.email
    }
  }
  
  console.error('No active instructors found in database')
  return null
}

/**
 * Get default instructor ID (for client-side use)
 */
export async function getDefaultInstructorId(): Promise<string | null> {
  const instructor = await getDefaultInstructor()
  return instructor?.id || null
}

