/**
 * ForeFlight CSV Importer Service
 * 
 * Handles parsing and importing ForeFlight logbook CSV exports
 * into the Desert Skies logbook system
 */

import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { createFlightLogEntry, FlightLogEntry } from "@/lib/faa-requirements-service"

export interface ForeFlightRow {
  Date: string
  AircraftID: string
  From: string
  To: string
  Route: string
  TimeOut: string
  TimeOff: string
  TimeOn: string
  TimeIn: string
  OnDuty: string
  OffDuty: string
  TotalTime: string
  PIC: string
  SIC: string
  Night: string
  Solo: string
  CrossCountry: string
  PICUS: string
  MultiPilot: string
  IFR: string
  Examiner: string
  NVG: string
  'NVG Ops': string
  Distance: string
  ActualInstrument: string
  SimulatedInstrument: string
  HobbsStart: string
  HobbsEnd: string
  TachStart: string
  TachEnd: string
  Holds: string
  Approach1: string
  Approach2: string
  Approach3: string
  Approach4: string
  Approach5: string
  Approach6: string
  DualGiven: string
  DualReceived: string
  SimulatedFlight: string
  GroundTraining: string
  GroundTrainingGiven: string
  InstructorName: string
  InstructorComments: string
  Person1: string
  Person2: string
  Person3: string
  Person4: string
  Person5: string
  Person6: string
  PilotComments: string
  'Flight Review (FAA)': string
  'IPC (FAA)': string
  'Checkride (FAA)': string
  'FAA 61.58 (FAA)': string
  'NVG Proficiency (FAA)': string
  'Takeoff Day': string
  'Landing Full-Stop Day': string
  DayTakeoffs: string
  DayLandingsFullStop: string
  NightTakeoffs: string
  NightLandingsFullStop: string
  AllLandings: string
  '[Hours]ATP XC': string
  '[Hours]PICUS': string
}

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: Array<{
    row: number
    error: string
    data?: any
  }>
  duplicates: Array<{
    row: number
    existingEntry: any
  }>
}

/**
 * Parse ForeFlight CSV file
 * 
 * ForeFlight CSV format:
 * - Lines 1-2: Header info
 * - Lines 3-74: Aircraft table
 * - Line 75: Column headers
 * - Line 76+: Flight data
 */
export function parseForeFlightCSV(csvContent: string): ForeFlightRow[] {
  const lines = csvContent.split('\n')
  
  // Find the header row (starts with "Date,")
  let headerIndex = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('Date,')) {
      headerIndex = i
      break
    }
  }
  
  if (headerIndex === -1) {
    throw new Error('Invalid ForeFlight CSV: Could not find header row starting with "Date,"')
  }
  
  // Parse header
  const headers = parseCSVLine(lines[headerIndex])
  
  // Parse data rows
  const rows: ForeFlightRow[] = []
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines
    
    const values = parseCSVLine(line)
    if (values.length !== headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}. Skipping.`)
      continue
    }
    
    // Create object from headers and values
    const row: any = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j]
    }
    
    rows.push(row as ForeFlightRow)
  }
  
  return rows
}

/**
 * Parse a single CSV line, handling quoted strings with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  // Add last field
  result.push(current.trim())
  
  return result
}

/**
 * Convert ForeFlight row to Desert Skies logbook entry
 */
async function convertForeFlightRow(
  row: ForeFlightRow,
  studentId: string,
  rowNumber: number
): Promise<{
  success: boolean
  entry?: Partial<FlightLogEntry>
  error?: string
}> {
  try {
    const supabase = await createClient(await cookies())
    
    // 1. Parse date
    const date = row.Date
    if (!date) {
      return { success: false, error: 'Missing date' }
    }
    
    // 2. Lookup/create aircraft by tail number
    const tailNumber = row.AircraftID.trim()
    if (!tailNumber) {
      return { success: false, error: 'Missing aircraft ID' }
    }
    
    let { data: aircraft, error: aircraftError } = await supabase
      .from('aircraft')
      .select('id, is_complex, is_high_performance, is_tailwheel, is_multi_engine')
      .eq('tail_number', tailNumber)
      .single()
    
    if (aircraftError || !aircraft) {
      // Aircraft doesn't exist - create placeholder
      console.log(`Creating placeholder aircraft: ${tailNumber}`)
      const { data: newAircraft, error: createError } = await supabase
        .from('aircraft')
        .insert({
          tail_number: tailNumber,
          make: 'Unknown',
          model: 'Unknown',
          year: null,
          status: 'active',
          // These will need to be updated manually
          is_complex: false,
          is_high_performance: false,
          is_tailwheel: false,
          is_multi_engine: false
        })
        .select()
        .single()
      
      if (createError || !newAircraft) {
        return { success: false, error: `Failed to create aircraft ${tailNumber}: ${createError?.message}` }
      }
      
      aircraft = newAircraft
    }
    
    // 3. Parse instructor name (optional)
    let instructorId: string | null = null
    const instructorName = row.InstructorName.trim()
    if (instructorName) {
      // Try to find instructor by name
      const nameParts = instructorName.split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')
      
      const { data: instructor } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'instructor')
        .or(`first_name.ilike.%${firstName}%,last_name.ilike.%${lastName}%`)
        .limit(1)
        .single()
      
      if (instructor) {
        instructorId = instructor.id
      }
      // If not found, leave as null - student can update later
    }
    
    // 4. Parse time fields (convert to decimal)
    const parseTime = (value: string): number => {
      const num = parseFloat(value || '0')
      return isNaN(num) ? 0 : num
    }
    
    const totalTime = parseTime(row.TotalTime)
    if (totalTime === 0) {
      return { success: false, error: 'Total time is zero or missing' }
    }
    
    // 5. Combine comments
    let remarks = ''
    if (row.PilotComments) {
      remarks += row.PilotComments.replace(/^"+|"+$/g, '') // Remove surrounding quotes
    }
    if (row.InstructorComments) {
      if (remarks) remarks += '\n\n---\n\n'
      remarks += 'Instructor: ' + row.InstructorComments.replace(/^"+|"+$/g, '')
    }
    
    // Truncate to 5000 chars if needed
    if (remarks.length > 5000) {
      remarks = remarks.substring(0, 4997) + '...'
    }
    
    // 6. Calculate aircraft category times based on aircraft characteristics
    const complexTime = aircraft.is_complex ? totalTime : 0
    const highPerformanceTime = aircraft.is_high_performance ? totalTime : 0
    const tailwheelTime = aircraft.is_tailwheel ? totalTime : 0
    const multiEngineTime = aircraft.is_multi_engine ? totalTime : 0
    
    // 7. Create entry object
    const entry: Partial<FlightLogEntry> = {
      student_id: studentId,
      instructor_id: instructorId,
      aircraft_id: aircraft.id,
      date: date,
      departure_airport: row.From,
      arrival_airport: row.To,
      route: row.Route,
      
      // Time fields
      total_time: totalTime,
      pic_time: parseTime(row.PIC),
      sic_time: parseTime(row.SIC),
      solo_time: parseTime(row.Solo),
      cross_country_time: parseTime(row.CrossCountry),
      night_time: parseTime(row.Night),
      instrument_time: parseTime(row.ActualInstrument) + parseTime(row.SimulatedInstrument),
      simulator_time: parseTime(row.SimulatedFlight),
      dual_received: parseTime(row.DualReceived),
      dual_given: parseTime(row.DualGiven),
      
      // Landings
      landings_day: parseInt(row.DayLandingsFullStop || '0'),
      landings_night: parseInt(row.NightLandingsFullStop || '0'),
      
      // Aircraft category times
      complex_time: complexTime,
      high_performance_time: highPerformanceTime,
      tailwheel_time: tailwheelTime,
      multi_engine_time: multiEngineTime,
      
      // Comments
      remarks: remarks || null,
      
      // ForeFlight metadata (stored as JSONB)
      ff_import_metadata: {
        source: 'foreflight_import',
        import_date: new Date().toISOString(),
        original_row: rowNumber,
        time_out: row.TimeOut,
        time_off: row.TimeOff,
        time_on: row.TimeOn,
        time_in: row.TimeIn,
        approaches: [
          row.Approach1,
          row.Approach2,
          row.Approach3,
          row.Approach4,
          row.Approach5,
          row.Approach6
        ].filter(Boolean),
        holds: parseInt(row.Holds || '0'),
        persons: [
          row.Person1,
          row.Person2,
          row.Person3,
          row.Person4,
          row.Person5,
          row.Person6
        ].filter(Boolean)
      },
      
      // Optional hobbs tracking
      hobbs_start: parseTime(row.HobbsStart) || null,
      hobbs_end: parseTime(row.HobbsEnd) || null,
      
      // Additional landings detail
      day_takeoffs: parseInt(row.DayTakeoffs || '0'),
      night_takeoffs: parseInt(row.NightTakeoffs || '0'),
      all_landings: parseInt(row.AllLandings || '0')
    }
    
    return { success: true, entry }
    
  } catch (error) {
    console.error('Error converting ForeFlight row:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if entry already exists (duplicate detection)
 */
async function checkForDuplicate(
  entry: Partial<FlightLogEntry>
): Promise<any | null> {
  try {
    const supabase = await createClient(await cookies())
    
    const { data, error } = await supabase
      .from('flight_log_entries')
      .select('*')
      .eq('student_id', entry.student_id!)
      .eq('date', entry.date!)
      .eq('aircraft_id', entry.aircraft_id!)
      .gte('total_time', (entry.total_time! - 0.1)) // Allow ±0.1 hour difference
      .lte('total_time', (entry.total_time! + 0.1))
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error checking for duplicate:', error)
    }
    
    return data || null
  } catch (error) {
    console.error('Error in checkForDuplicate:', error)
    return null
  }
}

/**
 * Import ForeFlight CSV for a student
 */
export async function importForeFlightCSV(
  csvContent: string,
  studentId: string,
  skipDuplicates: boolean = true
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
    duplicates: []
  }
  
  try {
    // 1. Parse CSV
    const rows = parseForeFlightCSV(csvContent)
    console.log(`Parsed ${rows.length} rows from ForeFlight CSV`)
    
    // 2. Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNumber = i + 76 // Actual line number in file (accounting for headers)
      
      // Convert to Desert Skies format
      const converted = await convertForeFlightRow(row, studentId, rowNumber)
      
      if (!converted.success || !converted.entry) {
        result.errors.push({
          row: rowNumber,
          error: converted.error || 'Unknown conversion error',
          data: row
        })
        result.skipped++
        continue
      }
      
      // Check for duplicates
      const duplicate = await checkForDuplicate(converted.entry)
      if (duplicate) {
        result.duplicates.push({
          row: rowNumber,
          existingEntry: duplicate
        })
        
        if (skipDuplicates) {
          result.skipped++
          continue
        }
      }
      
      // Create logbook entry
      const createResult = await createFlightLogEntry(converted.entry as any)
      
      if (!createResult.success) {
        result.errors.push({
          row: rowNumber,
          error: createResult.error || 'Failed to create entry',
          data: row
        })
        result.skipped++
      } else {
        result.imported++
      }
    }
    
    console.log(`Import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors`)
    
  } catch (error) {
    console.error('Error importing ForeFlight CSV:', error)
    result.success = false
    result.errors.push({
      row: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
  
  return result
}

/**
 * Preview ForeFlight import (parse only, don't import)
 */
export async function previewForeFlightImport(
  csvContent: string,
  studentId: string
): Promise<{
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  duplicates: number
  sample: any[]
  errors: Array<{ row: number; error: string }>
}> {
  try {
    const rows = parseForeFlightCSV(csvContent)
    let validRows = 0
    let invalidRows = 0
    let duplicates = 0
    const errors: Array<{ row: number; error: string }> = []
    const sample: any[] = []
    
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const row = rows[i]
      const converted = await convertForeFlightRow(row, studentId, i + 76)
      
      if (converted.success && converted.entry) {
        validRows++
        sample.push(converted.entry)
        
        // Check for duplicate
        const duplicate = await checkForDuplicate(converted.entry)
        if (duplicate) {
          duplicates++
        }
      } else {
        invalidRows++
        errors.push({
          row: i + 76,
          error: converted.error || 'Unknown error'
        })
      }
    }
    
    // Process remaining rows (just count, don't sample)
    for (let i = 10; i < rows.length; i++) {
      const row = rows[i]
      const converted = await convertForeFlightRow(row, studentId, i + 76)
      
      if (converted.success && converted.entry) {
        validRows++
        const duplicate = await checkForDuplicate(converted.entry)
        if (duplicate) duplicates++
      } else {
        invalidRows++
        errors.push({
          row: i + 76,
          error: converted.error || 'Unknown error'
        })
      }
    }
    
    return {
      success: true,
      totalRows: rows.length,
      validRows,
      invalidRows,
      duplicates,
      sample,
      errors
    }
  } catch (error) {
    console.error('Error previewing ForeFlight import:', error)
    return {
      success: false,
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicates: 0,
      sample: [],
      errors: [{
        row: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    }
  }
}

