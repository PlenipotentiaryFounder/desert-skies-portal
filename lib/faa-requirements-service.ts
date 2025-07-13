"use server"

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

export type CertificateType =
  | "private_pilot"
  | "commercial_pilot"
  | "instrument_rating"
  | "flight_instructor"
  | "multi_engine"
  | "atp"

export type RequirementType =
  | "total_time"
  | "pilot_in_command"
  | "solo"
  | "solo_cross_country"
  | "cross_country"
  | "night"
  | "instrument"
  | "complex"
  | "high_performance"
  | "tailwheel"
  | "multi_engine"
  | "simulator"
  | "dual_received"
  | "dual_given"
  | "takeoffs_landings"
  | "long_cross_country"
  | "checkride"

export interface FAARequirement {
  id: string
  certificate_type: CertificateType
  requirement_type: RequirementType
  description: string
  minimum_value: number
  reference: string
  created_at: string
  updated_at: string
}

export interface StudentRequirement {
  id: string
  student_id: string
  requirement_id: string
  current_value: number
  is_complete: boolean
  completion_date: string | null
  verified_by: string | null
  created_at: string
  updated_at: string
  requirement?: FAARequirement
}

export interface FlightLogEntry {
  id: string
  student_id: string
  date: string
  aircraft_id: string
  instructor_id: string | null
  flight_session_id: string | null
  total_time: number
  pic_time: number
  sic_time: number
  solo_time: number
  cross_country_time: number
  night_time: number
  instrument_time: number
  simulator_time: number
  dual_received: number
  dual_given: number
  landings_day: number
  landings_night: number
  complex_time: number
  high_performance_time: number
  tailwheel_time: number
  multi_engine_time: number
  remarks: string | null
  created_at: string
  updated_at: string
}

export async function getFAARequirements(certificateType?: CertificateType) {
  const supabase = await createClient(await cookies())

  let query = supabase.from("faa_requirements").select("*")

  if (certificateType) {
    query = query.eq("certificate_type", certificateType)
  }

  const { data, error } = await query.order("requirement_type")

  if (error) {
    console.error("Error fetching FAA requirements:", error)
    return []
  }

  return data as FAARequirement[]
}

export async function getFAARequirementById(id: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase.from("faa_requirements").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching FAA requirement:", error)
    return null
  }

  return data as FAARequirement
}

export async function createFAARequirement(requirement: Omit<FAARequirement, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("faa_requirements")
    .insert({
      certificate_type: requirement.certificate_type,
      requirement_type: requirement.requirement_type,
      description: requirement.description,
      minimum_value: requirement.minimum_value,
      reference: requirement.reference,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating FAA requirement:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/requirements")
  return { success: true, data }
}

export async function updateFAARequirement(id: string, requirement: Partial<FAARequirement>) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase
    .from("faa_requirements")
    .update({
      certificate_type: requirement.certificate_type,
      requirement_type: requirement.requirement_type,
      description: requirement.description,
      minimum_value: requirement.minimum_value,
      reference: requirement.reference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating FAA requirement:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/requirements")
  revalidatePath(`/admin/requirements/${id}`)
  return { success: true }
}

export async function deleteFAARequirement(id: string) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase.from("faa_requirements").delete().eq("id", id)

  if (error) {
    console.error("Error deleting FAA requirement:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/requirements")
  return { success: true }
}

export async function getStudentRequirements(studentId: string, certificateType?: CertificateType) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("student_requirements")
    .select(`
      *,
      requirement:requirement_id(*)
    `)
    .eq("student_id", studentId)

  if (error) {
    console.error("Error fetching student requirements:", error)
    return []
  }

  let filteredData = data as StudentRequirement[]

  // Filter by certificate type in JavaScript if specified
  if (certificateType && filteredData) {
    filteredData = filteredData.filter(req => 
      req.requirement && req.requirement.certificate_type === certificateType
    )
  }

  return filteredData || []
}

export async function getStudentRequirementById(id: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("student_requirements")
    .select(`
      *,
      requirement:requirement_id(*)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching student requirement:", error)
    return null
  }

  return data as StudentRequirement
}

export async function createStudentRequirement(
  requirement: Omit<StudentRequirement, "id" | "created_at" | "updated_at">,
) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("student_requirements")
    .insert({
      student_id: requirement.student_id,
      requirement_id: requirement.requirement_id,
      current_value: requirement.current_value || 0,
      is_complete: requirement.is_complete || false,
      completion_date: requirement.completion_date,
      verified_by: requirement.verified_by,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating student requirement:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/student/requirements`)
  revalidatePath(`/instructor/students/${requirement.student_id}/requirements`)
  return { success: true, data }
}

export async function updateStudentRequirement(id: string, requirement: Partial<StudentRequirement>) {
  const supabase = await createClient(await cookies())

  const { error } = await supabase
    .from("student_requirements")
    .update({
      current_value: requirement.current_value,
      is_complete: requirement.is_complete,
      completion_date: requirement.completion_date,
      verified_by: requirement.verified_by,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating student requirement:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/student/requirements`)
  return { success: true }
}

export async function verifyStudentRequirement(id: string, instructorId: string) {
  const supabase = await createClient(await cookies())

  // First get the requirement to check if it's complete
  const { data: requirement, error: fetchError } = await supabase
    .from("student_requirements")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !requirement) {
    console.error("Error fetching student requirement:", fetchError)
    return { success: false, error: fetchError?.message || "Requirement not found" }
  }

  // Only verify if it's complete
  if (!requirement.is_complete) {
    return { success: false, error: "Requirement is not complete" }
  }

  const { error } = await supabase
    .from("student_requirements")
    .update({
      verified_by: instructorId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error verifying student requirement:", error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/student/requirements`)
  revalidatePath(`/instructor/students/${requirement.student_id}/requirements`)
  return { success: true }
}

// Accept supabase client as a parameter
export async function getFlightLogEntries(supabase: any, studentId: string) {
  // Debug: log the authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  console.log('getFlightLogEntries: Supabase user:', userData, 'Error:', userError);

  const { data, error } = await supabase
    .from("flight_log_entries")
    .select(`
      *,
      aircraft:aircraft_id(id, tail_number, make, model),
      instructor:instructor_id(id, first_name, last_name)
    `)
    .eq("student_id", studentId)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching flight log entries:", error);
    return [];
  }

  // Fetch signatures for all entries
  const entryIds = data.map((e: any) => e.id);
  const { data: sigs } = await supabase
    .from("flight_log_entry_signatures")
    .select("entry_id, role, is_current")
    .in("entry_id", entryIds)
    .eq("is_current", true);

  // Map signatures to entries
  const sigMap: Record<string, { student: boolean; instructor: boolean }> = {};
  for (const entryId of entryIds) {
    sigMap[entryId] = { student: false, instructor: false };
  }
  for (const sig of sigs || []) {
    if (sig.role === 'student') sigMap[sig.entry_id].student = true;
    if (sig.role === 'instructor') sigMap[sig.entry_id].instructor = true;
  }

  return data.map((entry: any) => ({
    ...entry,
    student_signed: sigMap[entry.id]?.student || false,
    instructor_signed: sigMap[entry.id]?.instructor || false,
  }));
}

// Backward compatible wrapper for existing usages
export async function getFlightLogEntriesOld(studentId: string) {
  const supabase = await createClient(await cookies());
  return getFlightLogEntries(supabase, studentId);
}

export async function getFlightLogEntryById(id: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("flight_log_entries")
    .select(`
      *,
      aircraft:aircraft_id(id, tail_number, make, model),
      instructor:instructor_id(id, first_name, last_name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching flight log entry:", error)
    return null
  }

  // Fetch signatures for this entry
  const { data: sigs } = await supabase
    .from("flight_log_entry_signatures")
    .select("role, is_current")
    .eq("entry_id", id)
    .eq("is_current", true)

  let student_signed = false, instructor_signed = false
  for (const sig of sigs || []) {
    if (sig.role === 'student') student_signed = true
    if (sig.role === 'instructor') instructor_signed = true
  }

  return {
    ...data,
    student_signed,
    instructor_signed,
  }
}

export async function createFlightLogEntry(entry: Omit<FlightLogEntry, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("flight_log_entries")
    .insert({
      student_id: entry.student_id,
      date: entry.date,
      aircraft_id: entry.aircraft_id,
      instructor_id: entry.instructor_id,
      flight_session_id: entry.flight_session_id,
      total_time: entry.total_time,
      pic_time: entry.pic_time,
      sic_time: entry.sic_time,
      solo_time: entry.solo_time,
      cross_country_time: entry.cross_country_time,
      night_time: entry.night_time,
      instrument_time: entry.instrument_time,
      simulator_time: entry.simulator_time,
      dual_received: entry.dual_received,
      dual_given: entry.dual_given,
      landings_day: entry.landings_day,
      landings_night: entry.landings_night,
      complex_time: entry.complex_time,
      high_performance_time: entry.high_performance_time,
      tailwheel_time: entry.tailwheel_time,
      multi_engine_time: entry.multi_engine_time,
      remarks: entry.remarks,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating flight log entry:", error)
    return { success: false, error: error.message }
  }

  // Update student requirements based on this flight
  await updateRequirementsFromFlight(entry.student_id, data)

  revalidatePath(`/student/logbook`)
  return { success: true, data }
}

export async function updateFlightLogEntry(id: string, entry: Partial<FlightLogEntry>) {
  const supabase = await createClient(await cookies())

  // First get the original entry
  const { data: originalEntry, error: fetchError } = await supabase
    .from("flight_log_entries")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError) {
    console.error("Error fetching original flight log entry:", fetchError)
    return { success: false, error: fetchError.message }
  }

  const { error } = await supabase
    .from("flight_log_entries")
    .update({
      date: entry.date,
      aircraft_id: entry.aircraft_id,
      instructor_id: entry.instructor_id,
      flight_session_id: entry.flight_session_id,
      total_time: entry.total_time,
      pic_time: entry.pic_time,
      sic_time: entry.sic_time,
      solo_time: entry.solo_time,
      cross_country_time: entry.cross_country_time,
      night_time: entry.night_time,
      instrument_time: entry.instrument_time,
      simulator_time: entry.simulator_time,
      dual_received: entry.dual_received,
      dual_given: entry.dual_given,
      landings_day: entry.landings_day,
      landings_night: entry.landings_night,
      complex_time: entry.complex_time,
      high_performance_time: entry.high_performance_time,
      tailwheel_time: entry.tailwheel_time,
      multi_engine_time: entry.multi_engine_time,
      remarks: entry.remarks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("Error updating flight log entry:", error)
    return { success: false, error: error.message }
  }

  // Update student requirements based on the difference between original and updated entry
  await updateRequirementsFromFlightUpdate(originalEntry.student_id, originalEntry, { ...originalEntry, ...entry })

  revalidatePath(`/student/logbook`)
  return { success: true }
}

export async function deleteFlightLogEntry(id: string) {
  const supabase = await createClient(await cookies())

  // First get the entry to be deleted
  const { data: entry, error: fetchError } = await supabase.from("flight_log_entries").select("*").eq("id", id).single()

  if (fetchError) {
    console.error("Error fetching flight log entry:", fetchError)
    return { success: false, error: fetchError.message }
  }

  const { error } = await supabase.from("flight_log_entries").delete().eq("id", id)

  if (error) {
    console.error("Error deleting flight log entry:", error)
    return { success: false, error: error.message }
  }

  // Update student requirements to subtract this flight's hours
  await updateRequirementsFromFlightDeletion(entry.student_id, entry)

  revalidatePath(`/student/logbook`)
  return { success: true }
}

export async function getStudentTotalHours(studentId: string) {
  const supabase = await createClient(await cookies())

  const { data, error } = await supabase
    .from("flight_log_entries")
    .select(`
      total_time,
      pic_time,
      solo_time,
      cross_country_time,
      night_time,
      instrument_time,
      simulator_time,
      dual_received,
      dual_given,
      landings_day,
      landings_night,
      complex_time,
      high_performance_time,
      tailwheel_time,
      multi_engine_time
    `)
    .eq("student_id", studentId)

  if (error) {
    console.error("Error fetching student total hours:", error)
    return null
  }

  // Calculate totals
  const totals = {
    total_time: 0,
    pic_time: 0,
    solo_time: 0,
    cross_country_time: 0,
    night_time: 0,
    instrument_time: 0,
    simulator_time: 0,
    dual_received: 0,
    dual_given: 0,
    landings_day: 0,
    landings_night: 0,
    complex_time: 0,
    high_performance_time: 0,
    tailwheel_time: 0,
    multi_engine_time: 0,
  }

  data.forEach((entry) => {
    Object.keys(totals).forEach((key) => {
      totals[key as keyof typeof totals] += Number(entry[key as keyof typeof entry]) || 0
    })
  })

  return totals
}

// Helper function to update requirements when a new flight is logged
async function updateRequirementsFromFlight(studentId: string, flight: any) {
  const supabase = await createClient(await cookies())

  // Get all requirements for this student
  const { data: requirements, error } = await supabase
    .from("student_requirements")
    .select(`
      *,
      requirement:requirement_id(*)
    `)
    .eq("student_id", studentId)

  if (error) {
    console.error("Error fetching student requirements:", error)
    return
  }

  // Map flight categories to requirement types
  const typeMap: Record<string, RequirementType> = {
    total_time: "total_time",
    pic_time: "pilot_in_command",
    solo_time: "solo",
    cross_country_time: "cross_country",
    night_time: "night",
    instrument_time: "instrument",
    complex_time: "complex",
    high_performance_time: "high_performance",
    tailwheel_time: "tailwheel",
    multi_engine_time: "multi_engine",
    simulator_time: "simulator",
    dual_received: "dual_received",
    dual_given: "dual_given",
  }

  // Update each requirement
  for (const req of requirements) {
    const type = req.requirement.requirement_type
    let valueToAdd = 0

    // Find the corresponding flight value
    for (const [flightKey, reqType] of Object.entries(typeMap)) {
      if (reqType === type) {
        valueToAdd = Number(flight[flightKey]) || 0
        break
      }
    }

    // Special case for takeoffs and landings
    if (type === "takeoffs_landings") {
      valueToAdd = (Number(flight.landings_day) || 0) + (Number(flight.landings_night) || 0)
    }

    if (valueToAdd > 0) {
      const newValue = (req.current_value || 0) + valueToAdd
      const isComplete = newValue >= req.requirement.minimum_value

      // Update the requirement
      await supabase
        .from("student_requirements")
        .update({
          current_value: newValue,
          is_complete: isComplete,
          completion_date: isComplete && !req.is_complete ? new Date().toISOString() : req.completion_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.id)
    }
  }
}

// Helper function to update requirements when a flight is updated
async function updateRequirementsFromFlightUpdate(studentId: string, originalFlight: any, updatedFlight: any) {
  const supabase = await createClient(await cookies())

  // Get all requirements for this student
  const { data: requirements, error } = await supabase
    .from("student_requirements")
    .select(`
      *,
      requirement:requirement_id(*)
    `)
    .eq("student_id", studentId)

  if (error) {
    console.error("Error fetching student requirements:", error)
    return
  }

  // Map flight categories to requirement types
  const typeMap: Record<string, RequirementType> = {
    total_time: "total_time",
    pic_time: "pilot_in_command",
    solo_time: "solo",
    cross_country_time: "cross_country",
    night_time: "night",
    instrument_time: "instrument",
    complex_time: "complex",
    high_performance_time: "high_performance",
    tailwheel_time: "tailwheel",
    multi_engine_time: "multi_engine",
    simulator_time: "simulator",
    dual_received: "dual_received",
    dual_given: "dual_given",
  }

  // Update each requirement
  for (const req of requirements) {
    const type = req.requirement.requirement_type
    let valueDifference = 0

    // Find the corresponding flight value difference
    for (const [flightKey, reqType] of Object.entries(typeMap)) {
      if (reqType === type) {
        const originalValue = Number(originalFlight[flightKey]) || 0
        const updatedValue = Number(updatedFlight[flightKey]) || 0
        valueDifference = updatedValue - originalValue
        break
      }
    }

    // Special case for takeoffs and landings
    if (type === "takeoffs_landings") {
      const originalLandings = (Number(originalFlight.landings_day) || 0) + (Number(originalFlight.landings_night) || 0)
      const updatedLandings = (Number(updatedFlight.landings_day) || 0) + (Number(updatedFlight.landings_night) || 0)
      valueDifference = updatedLandings - originalLandings
    }

    if (valueDifference !== 0) {
      const newValue = Math.max(0, (req.current_value || 0) + valueDifference)
      const isComplete = newValue >= req.requirement.minimum_value

      // Update the requirement
      await supabase
        .from("student_requirements")
        .update({
          current_value: newValue,
          is_complete: isComplete,
          completion_date: isComplete && !req.is_complete ? new Date().toISOString() : req.completion_date,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.id)
    }
  }
}

// Helper function to update requirements when a flight is deleted
async function updateRequirementsFromFlightDeletion(studentId: string, flight: any) {
  const supabase = await createClient(await cookies())

  // Get all requirements for this student
  const { data: requirements, error } = await supabase
    .from("student_requirements")
    .select(`
      *,
      requirement:requirement_id(*)
    `)
    .eq("student_id", studentId)

  if (error) {
    console.error("Error fetching student requirements:", error)
    return
  }

  // Map flight categories to requirement types
  const typeMap: Record<string, RequirementType> = {
    total_time: "total_time",
    pic_time: "pilot_in_command",
    solo_time: "solo",
    cross_country_time: "cross_country",
    night_time: "night",
    instrument_time: "instrument",
    complex_time: "complex",
    high_performance_time: "high_performance",
    tailwheel_time: "tailwheel",
    multi_engine_time: "multi_engine",
    simulator_time: "simulator",
    dual_received: "dual_received",
    dual_given: "dual_given",
  }

  // Update each requirement
  for (const req of requirements) {
    const type = req.requirement.requirement_type
    let valueToSubtract = 0

    // Find the corresponding flight value
    for (const [flightKey, reqType] of Object.entries(typeMap)) {
      if (reqType === type) {
        valueToSubtract = Number(flight[flightKey]) || 0
        break
      }
    }

    // Special case for takeoffs and landings
    if (type === "takeoffs_landings") {
      valueToSubtract = (Number(flight.landings_day) || 0) + (Number(flight.landings_night) || 0)
    }

    if (valueToSubtract > 0) {
      const newValue = Math.max(0, (req.current_value || 0) - valueToSubtract)
      const isComplete = newValue >= req.requirement.minimum_value

      // Update the requirement
      await supabase
        .from("student_requirements")
        .update({
          current_value: newValue,
          is_complete: isComplete,
          completion_date: isComplete ? req.completion_date : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", req.id)
    }
  }
}

export async function initializeStudentRequirements(studentId: string, certificateType: CertificateType) {
  const supabase = await createClient(await cookies())

  // Get all requirements for this certificate type
  const { data: requirements, error } = await supabase
    .from("faa_requirements")
    .select("*")
    .eq("certificate_type", certificateType)

  if (error) {
    console.error("Error fetching FAA requirements:", error)
    return { success: false, error: error.message }
  }

  // Check if student already has these requirements
  const { data: existingRequirements, error: existingError } = await supabase
    .from("student_requirements")
    .select("requirement_id")
    .eq("student_id", studentId)

  if (existingError) {
    console.error("Error fetching existing student requirements:", existingError)
    return { success: false, error: existingError.message }
  }

  const existingRequirementIds = existingRequirements.map((r) => r.requirement_id)

  // Create student requirements for any that don't exist
  const newRequirements = requirements
    .filter((r) => !existingRequirementIds.includes(r.id))
    .map((r) => ({
      student_id: studentId,
      requirement_id: r.id,
      current_value: 0,
      is_complete: false,
    }))

  if (newRequirements.length > 0) {
    const { error: insertError } = await supabase.from("student_requirements").insert(newRequirements)

    if (insertError) {
      console.error("Error creating student requirements:", insertError)
      return { success: false, error: insertError.message }
    }
  }

  revalidatePath(`/student/requirements`)
  revalidatePath(`/instructor/students/${studentId}/requirements`)
  return { success: true }
}

export async function getStudentCertificateProgress(studentId: string, certificateType: CertificateType) {
  const requirements = await getStudentRequirements(studentId, certificateType)

  if (!requirements || requirements.length === 0) {
    return {
      totalRequirements: 0,
      completedRequirements: 0,
      progressPercentage: 0,
      requirements: [],
    }
  }

  const completedRequirements = requirements.filter((r) => r.is_complete).length
  const progressPercentage = (completedRequirements / requirements.length) * 100

  return {
    totalRequirements: requirements.length,
    completedRequirements,
    progressPercentage,
    requirements,
  }
}

// --- Logbook Signature Logic ---
export async function addLogbookSignature(entryId: string, userId: string, role: 'student' | 'instructor', pin: string) {
  const supabase = await createClient(await cookies())
  const pin_hash = await bcrypt.hash(pin, 10)
  // Invalidate any previous signature for this entry/role/user
  await supabase.from("flight_log_entry_signatures").update({ is_current: false }).eq("entry_id", entryId).eq("role", role).eq("user_id", userId)
  // Add new signature
  const { error } = await supabase.from("flight_log_entry_signatures").insert({ entry_id: entryId, user_id: userId, role, pin_hash, is_current: true })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function verifyLogbookSignature(entryId: string, userId: string, role: 'student' | 'instructor', pin: string) {
  const supabase = await createClient(await cookies())
  const { data, error } = await supabase.from("flight_log_entry_signatures").select("pin_hash").eq("entry_id", entryId).eq("user_id", userId).eq("role", role).eq("is_current", true).single()
  if (error || !data) return false
  return await bcrypt.compare(pin, data.pin_hash)
}

export async function invalidateLogbookSignatures(entryId: string, role?: 'student' | 'instructor') {
  const supabase = await createClient(await cookies())
  let query = supabase.from("flight_log_entry_signatures").update({ is_current: false }).eq("entry_id", entryId)
  if (role) query = query.eq("role", role)
  await query
}

// --- Logbook Audit Logic ---
export async function logLogbookAudit(entryId: string, action: string, performedBy: string, notes?: string) {
  const supabase = await createClient(await cookies())
  await supabase.from("flight_log_entry_audit").insert({ entry_id: entryId, action, performed_by: performedBy, notes })
}

// --- Status Transition Logic ---
export async function setLogbookEntryStatus(entryId: string, status: 'draft' | 'final' | 'voided', voidedBy?: string, voidReason?: string) {
  const supabase = await createClient(await cookies())
  const update: any = { status }
  if (status === 'voided') {
    update.voided_by = voidedBy
    update.voided_at = new Date().toISOString()
    update.void_reason = voidReason
  }
  await supabase.from("flight_log_entries").update(update).eq("id", entryId)
}
