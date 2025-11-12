/**
 * Logbook Service
 * 
 * Handles automatic creation of logbook entries from completed missions
 * Integrates with the mission workflow system to ensure seamless logbook updates
 */

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createFlightLogEntry, FlightLogEntry } from "@/lib/faa-requirements-service"
import { getMissionById } from "@/lib/mission-service"
import { revalidatePath } from "next/cache"

export interface LogbookCreationResult {
  success: boolean
  studentEntry?: FlightLogEntry
  instructorEntry?: FlightLogEntry
  error?: string
}

/**
 * Create logbook entries for both student and instructor from a completed mission
 * 
 * This function:
 * 1. Retrieves the mission and its training events
 * 2. Finds the flight training event
 * 3. Extracts flight hours (from hobbs or direct entry)
 * 4. Creates a student logbook entry (dual_received)
 * 5. Creates an instructor logbook entry (dual_given)
 * 6. Links both entries to the mission
 * 7. Auto-populates remarks from debrief
 * 
 * @param missionId - The ID of the completed mission
 * @returns LogbookCreationResult with both entries or error
 */
export async function createLogbookEntriesFromMission(
  missionId: string
): Promise<LogbookCreationResult> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // 1. Get mission with all related data
    const mission = await getMissionById(missionId)
    
    if (!mission) {
      return {
        success: false,
        error: "Mission not found"
      }
    }

    // 2. Find the flight training event
    const flightEvent = mission.training_events?.find(
      (event: any) => event.event_type === 'flight' && event.billing_category === 'flight_instruction'
    )

    if (!flightEvent) {
      return {
        success: false,
        error: "No flight training event found for this mission"
      }
    }

    // 3. Extract flight hours
    let flightHours = 0
    
    // Method 1: Direct entry (preferred)
    if (flightEvent.total_flight_hours && flightEvent.total_flight_hours > 0) {
      flightHours = flightEvent.total_flight_hours
    }
    // Method 2: Calculate from hobbs
    else if (flightEvent.hobbs_start && flightEvent.hobbs_end) {
      flightHours = flightEvent.hobbs_end - flightEvent.hobbs_start
    }
    // Method 3: Use billable_hours
    else if (flightEvent.billable_hours) {
      flightHours = flightEvent.billable_hours
    }
    // Method 4: Calculate from actual duration
    else if (flightEvent.actual_duration_minutes) {
      flightHours = flightEvent.actual_duration_minutes / 60
    }

    if (flightHours <= 0) {
      return {
        success: false,
        error: "No flight hours recorded for this mission"
      }
    }

    // Round to 2 decimal places
    flightHours = Math.round(flightHours * 100) / 100

    // 4. Get debrief remarks (if available)
    let remarks = `Mission ${mission.mission_code}`
    if (mission.debrief) {
      const debrief = mission.debrief as any
      if (debrief.general_overview) {
        remarks += `\n\n${debrief.general_overview.substring(0, 200)}`
      }
      if (debrief.key_takeaways && Array.isArray(debrief.key_takeaways)) {
        const strengths = debrief.key_takeaways
          .filter((t: any) => t.category === 'strength')
          .map((t: any) => t.observation)
          .join('; ')
        if (strengths) {
          remarks += `\n\nStrengths: ${strengths}`
        }
      }
    }

    // Truncate remarks to fit database constraints (typically 1000 chars)
    if (remarks.length > 1000) {
      remarks = remarks.substring(0, 997) + '...'
    }

    // 5. Determine if this is a solo flight
    const isSolo = !mission.instructor_id || mission.lesson?.lesson_type === 'solo'

    // 6. Create STUDENT logbook entry
    const studentEntryData = {
      student_id: mission.student_id,
      instructor_id: isSolo ? null : mission.instructor_id,
      aircraft_id: flightEvent.aircraft_id || mission.aircraft_id,
      mission_id: missionId,
      date: mission.scheduled_date,
      
      // Flight times
      total_time: flightHours,
      pic_time: isSolo ? flightHours : 0, // PIC only if solo
      solo_time: isSolo ? flightHours : 0,
      dual_received: isSolo ? 0 : flightHours, // Dual received if with instructor
      
      // Initialize other times to 0 (can be updated later)
      sic_time: 0,
      cross_country_time: 0,
      night_time: 0,
      instrument_time: 0,
      simulator_time: 0,
      dual_given: 0,
      
      // Landings (can be updated later)
      landings_day: 0,
      landings_night: 0,
      
      // Aircraft category times (can be updated later)
      complex_time: 0,
      high_performance_time: 0,
      tailwheel_time: 0,
      multi_engine_time: 0,
      
      remarks: remarks
    }

    const studentResult = await createFlightLogEntry(studentEntryData)
    
    if (!studentResult.success) {
      return {
        success: false,
        error: `Failed to create student logbook entry: ${studentResult.error}`
      }
    }

    // 7. Create INSTRUCTOR logbook entry (if not solo)
    let instructorEntry: FlightLogEntry | undefined
    
    if (!isSolo && mission.instructor_id) {
      const instructorEntryData = {
        student_id: mission.instructor_id, // Instructor's logbook
        instructor_id: null, // No instructor for instructor's own entry
        aircraft_id: flightEvent.aircraft_id || mission.aircraft_id,
        mission_id: missionId,
        date: mission.scheduled_date,
        
        // Flight times
        total_time: flightHours,
        pic_time: flightHours, // Instructor is PIC
        dual_given: flightHours, // Instructor gives dual instruction
        
        // Initialize other times to 0
        sic_time: 0,
        solo_time: 0,
        cross_country_time: 0,
        night_time: 0,
        instrument_time: 0,
        simulator_time: 0,
        dual_received: 0,
        
        // Landings
        landings_day: 0,
        landings_night: 0,
        
        // Aircraft category times
        complex_time: 0,
        high_performance_time: 0,
        tailwheel_time: 0,
        multi_engine_time: 0,
        
        remarks: `Instruction given - ${remarks}`
      }

      const instructorResult = await createFlightLogEntry(instructorEntryData)
      
      if (!instructorResult.success) {
        console.error('Failed to create instructor logbook entry:', instructorResult.error)
        // Don't fail the whole operation if instructor entry fails
        // Student entry is more critical
      } else {
        instructorEntry = instructorResult.data as FlightLogEntry
      }
    }

    // 8. Revalidate paths
    revalidatePath('/student/logbook')
    revalidatePath('/instructor/logbook')
    revalidatePath(`/student/missions/${missionId}`)
    revalidatePath(`/instructor/missions/${missionId}`)

    return {
      success: true,
      studentEntry: studentResult.data as FlightLogEntry,
      instructorEntry: instructorEntry
    }

  } catch (error) {
    console.error('Error in createLogbookEntriesFromMission:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Check if logbook entries already exist for a mission
 * Prevents duplicate entries
 */
export async function logbookEntriesExistForMission(
  missionId: string
): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('flight_log_entries')
      .select('id')
      .eq('mission_id', missionId)
      .limit(1)

    if (error) {
      console.error('Error checking for existing logbook entries:', error)
      return false
    }

    return data && data.length > 0
  } catch (error) {
    console.error('Error in logbookEntriesExistForMission:', error)
    return false
  }
}

/**
 * Get logbook entries for a specific mission
 */
export async function getLogbookEntriesForMission(
  missionId: string
): Promise<FlightLogEntry[]> {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('flight_log_entries')
      .select(`
        *,
        aircraft:aircraft_id(id, tail_number, make, model),
        instructor:instructor_id(id, first_name, last_name)
      `)
      .eq('mission_id', missionId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching logbook entries for mission:', error)
      return []
    }

    return data as FlightLogEntry[]
  } catch (error) {
    console.error('Error in getLogbookEntriesForMission:', error)
    return []
  }
}


