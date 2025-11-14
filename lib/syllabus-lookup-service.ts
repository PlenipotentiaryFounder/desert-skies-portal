"use server"

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export interface SyllabusInfo {
  id: string
  name: string
  description: string | null
  category: string | null
}

/**
 * Map of program names to syllabus categories
 */
const PROGRAM_CATEGORY_MAP: Record<string, string> = {
  'private_pilot': 'private',
  'instrument_rating': 'instrument',
  'commercial_pilot': 'commercial',
  'multi_engine': 'multi-engine',
  'multi_engine_rating': 'multi-engine',
  'flight_instructor': 'instructor',
  'discovery_flight': 'discovery'
}

/**
 * Get syllabus by program name
 * @param program - Program name (e.g., 'private_pilot', 'instrument_rating')
 * @returns Syllabus info or null if not found
 */
export async function getSyllabusByProgram(program: string): Promise<SyllabusInfo | null> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  // Map program to category
  const category = PROGRAM_CATEGORY_MAP[program] || 'private'
  
  // Get active syllabus for this category
  const { data: syllabus, error } = await supabase
    .from('syllabi')
    .select('id, name, description, category')
    .eq('category', category)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  
  if (error) {
    console.error(`Error fetching syllabus for program ${program}:`, error)
    return null
  }
  
  if (!syllabus) {
    console.warn(`No active syllabus found for program ${program} (category: ${category})`)
    return null
  }
  
  return syllabus as SyllabusInfo
}

/**
 * Get syllabus ID by program name (for client-side use)
 */
export async function getSyllabusIdByProgram(program: string): Promise<string | null> {
  const syllabus = await getSyllabusByProgram(program)
  return syllabus?.id || null
}

/**
 * Get all program types and their corresponding syllabi
 */
export async function getAllProgramSyllabi(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const { data: syllabi, error } = await supabase
    .from('syllabi')
    .select('id, category')
    .eq('is_active', true)
  
  if (error || !syllabi) {
    console.error('Error fetching all syllabi:', error)
    return {}
  }
  
  // Create reverse mapping: program -> syllabus_id
  const mapping: Record<string, string> = {}
  
  for (const [program, category] of Object.entries(PROGRAM_CATEGORY_MAP)) {
    const syllabus = syllabi.find(s => s.category === category)
    if (syllabus) {
      mapping[program] = syllabus.id
    }
  }
  
  return mapping
}

