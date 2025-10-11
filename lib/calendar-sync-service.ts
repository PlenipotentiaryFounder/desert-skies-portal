import { 
  CalendarEvent, 
  SyncResult,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEvents,
  saveExternalCalendarEvent,
  deleteExternalCalendarEvent,
  logSyncOperation
} from "./calendar-service"
import { CalendarOAuthService } from "./calendar-oauth-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { format, parseISO } from "date-fns"

// Types for flight sessions (based on existing service)
interface FlightSession {
  id: string
  enrollment_id: string
  instructor_id: string
  aircraft_id: string
  date: string
  start_time: string
  end_time: string
  status: "scheduled" | "completed" | "canceled" | "no_show"
  session_type: "mission" | "ground" | "mock_oral" | "mock_check_ride"
  notes?: string
  student?: {
    first_name: string
    last_name: string
    email: string
  }
  instructor?: {
    first_name: string
    last_name: string
    email: string
  }
  aircraft?: {
    tail_number: string
    make: string
    model: string
  }
  lesson?: {
    title: string
  }
}

interface CalendarConnection {
  id: string
  user_id: string
  provider: 'google' | 'outlook' | 'apple'
  provider_account_id?: string
  sync_status: 'active' | 'paused' | 'error'
}

export class CalendarSyncService {
  // Main sync function - exports flight sessions and imports external events
  static async syncUserCalendars(userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      records_processed: 0,
      errors: [],
      metadata: {}
    }

    try {
      // Get all active calendar connections for the user
      const connections = await this.getActiveCalendarConnections(userId)

      for (const connection of connections) {
        try {
          // Export flight sessions to external calendar
          const exportResult = await this.exportFlightSessionsToCalendar(connection.id, userId)
          result.records_processed += exportResult.records_processed
          result.errors.push(...exportResult.errors)
          result.metadata![`export_${connection.provider}`] = exportResult.records_processed

          // Import external events into app
          const importResult = await this.importExternalEventsToApp(connection.id, userId)
          result.records_processed += importResult.records_processed
          result.errors.push(...importResult.errors)
          result.metadata![`import_${connection.provider}`] = importResult.records_processed

          // Update last sync timestamp
          await CalendarOAuthService.updateCalendarConnection(connection.id, {
            last_sync_at: new Date().toISOString()
          })

        } catch (connectionError) {
          console.error(`Sync failed for ${connection.provider}:`, connectionError)
          result.errors.push(`Failed to sync ${connection.provider}: ${connectionError}`)
          result.success = false

          // Mark connection as having errors
          await CalendarOAuthService.updateCalendarConnection(connection.id, {
            sync_status: 'error'
          })
        }
      }

      // Log the sync operation
      for (const connection of connections) {
        await logSyncOperation(
          connection.id,
          'refresh',
          result.success ? 'success' : 'error',
          result.records_processed,
          result.errors,
          result.metadata
        )
      }

    } catch (error) {
      console.error('Calendar sync failed:', error)
      result.success = false
      result.errors.push(`Sync failed: ${error}`)
    }

    return result
  }

  // Export flight sessions to external calendar
  static async exportFlightSessionsToCalendar(
    connectionId: string,
    userId: string,
    since?: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      records_processed: 0,
      errors: [],
      metadata: {}
    }

    try {
      // Get flight sessions that need to be exported
      const flightSessions = await this.getFlightSessionsForExport(userId, since)

      for (const session of flightSessions) {
        try {
          // Check if this session is already exported
          const existingExternalEvent = await this.getExistingExternalEvent(connectionId, session.id)

          if (existingExternalEvent) {
            // Update existing event if needed
            await this.updateExternalEventIfChanged(existingExternalEvent, session, connectionId)
          } else {
            // Create new external event
            const calendarEvent = this.convertFlightSessionToCalendarEvent(session)
            const externalId = await createCalendarEvent(connectionId, calendarEvent)

            // Save the mapping in our database
            await saveExternalCalendarEvent(userId, connectionId, {
              ...calendarEvent,
              external_id: externalId,
              flight_session_id: session.id,
              is_flight_session: true
            })
          }

          result.records_processed++

        } catch (sessionError) {
          console.error(`Failed to export flight session ${session.id}:`, sessionError)
          result.errors.push(`Failed to export session ${session.id}: ${sessionError}`)
          result.success = false
        }
      }

    } catch (error) {
      console.error('Flight session export failed:', error)
      result.success = false
      result.errors.push(`Export failed: ${error}`)
    }

    return result
  }

  // Import external calendar events into the app
  static async importExternalEventsToApp(
    connectionId: string,
    userId: string,
    since?: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      records_processed: 0,
      errors: [],
      metadata: {}
    }

    try {
      // Get calendar connections for this user
      const cookieStore = await cookies()
      const supabase = await createClient(cookieStore)

      const { data: connection, error } = await supabase
        .from('calendar_connections')
        .select('*')
        .eq('id', connectionId)
        .eq('user_id', userId)
        .single()

      if (error || !connection) {
        throw new Error('Calendar connection not found')
      }

      // Get external calendar events
      const startTime = since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
      const endTime = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // Next 90 days

      const externalEvents = await getCalendarEvents(connectionId, startTime, endTime, 500)

      // Filter out flight session events (we don't want to import our own exports)
      const nonFlightEvents = externalEvents.filter(event => !event.is_flight_session)

      for (const event of nonFlightEvents) {
        try {
          // Check if this event already exists in our database
          const existingEvent = await this.getExistingExternalEventByExternalId(connectionId, event.external_id!)

          if (!existingEvent) {
            // Save new external event
            await saveExternalCalendarEvent(userId, connectionId, event)
            result.records_processed++
          } else {
            // Update existing event if needed
            await this.updateExternalEventIfChanged(existingEvent, event, connectionId)
          }

        } catch (eventError) {
          console.error(`Failed to import external event ${event.external_id}:`, eventError)
          result.errors.push(`Failed to import event ${event.external_id}: ${eventError}`)
          result.success = false
        }
      }

    } catch (error) {
      console.error('External event import failed:', error)
      result.success = false
      result.errors.push(`Import failed: ${error}`)
    }

    return result
  }

  // Handle flight session creation/update - automatically export to calendars
  static async handleFlightSessionChange(
    session: FlightSession,
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    try {
      // Get all active calendar connections for the instructor
      const connections = await this.getActiveCalendarConnections(session.instructor_id)

      for (const connection of connections) {
        try {
          if (operation === 'delete') {
            // Find and delete the external event
            const existingEvent = await this.getExistingExternalEvent(connection.id, session.id)
            if (existingEvent) {
              await deleteCalendarEvent(connection.id, existingEvent.external_id)
              await deleteExternalCalendarEvent(existingEvent.id)
            }
          } else {
            // Export/update the flight session
            await this.exportFlightSessionsToCalendar(connection.id, session.instructor_id)
          }

          // Log the operation
          await logSyncOperation(
            connection.id,
            operation === 'create' ? 'export' : operation === 'update' ? 'export' : 'export',
            'success',
            1,
            [],
            { flight_session_id: session.id, operation }
          )

        } catch (connectionError) {
          console.error(`Failed to ${operation} flight session for ${connection.provider}:`, connectionError)

          await logSyncOperation(
            connection.id,
            operation === 'create' ? 'export' : operation === 'update' ? 'export' : 'export',
            'error',
            0,
            [`Failed to ${operation} flight session: ${connectionError}`],
            { flight_session_id: session.id, operation }
          )
        }
      }

    } catch (error) {
      console.error(`Failed to handle flight session ${operation}:`, error)
    }
  }

  // Helper methods
  private static async getActiveCalendarConnections(userId: string): Promise<CalendarConnection[]> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('sync_status', 'active')
      .order('connected_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch calendar connections: ${error.message}`)
    }

    return data as CalendarConnection[]
  }

  private static async getFlightSessionsForExport(userId: string, since?: string): Promise<FlightSession[]> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get flight sessions for this instructor that haven't been exported recently
    let query = supabase
      .from('flight_sessions')
      .select(`
        *,
        student:student_enrollments!enrollment_id (
          student:profiles!student_id (
            first_name,
            last_name,
            email
          )
        ),
        instructor:profiles!instructor_id (
          first_name,
          last_name,
          email
        ),
        aircraft:aircraft (
          tail_number,
          make,
          model
        ),
        lesson:syllabus_lessons (
          title
        )
      `)
      .eq('instructor_id', userId)
      .in('status', ['scheduled', 'completed'])

    if (since) {
      query = query.gte('updated_at', since)
    }

    const { data, error } = await query
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch flight sessions: ${error.message}`)
    }

    return (data as any[]).map(session => ({
      ...session,
      student: session.student?.student,
      enrollment: undefined // Remove enrollment object
    })) as FlightSession[]
  }

  private static convertFlightSessionToCalendarEvent(session: FlightSession): CalendarEvent {
    const startDateTime = `${session.date}T${session.start_time}:00`
    const endDateTime = `${session.date}T${session.end_time}:00`

    const studentName = session.student
      ? `${session.student.first_name} ${session.student.last_name}`
      : 'Student'

    const instructorName = session.instructor
      ? `${session.instructor.first_name} ${session.instructor.last_name}`
      : 'Instructor'

    const aircraftInfo = session.aircraft
      ? `${session.aircraft.tail_number} (${session.aircraft.make} ${session.aircraft.model})`
      : 'Aircraft TBD'

    const lessonInfo = session.lesson ? ` - ${session.lesson.title}` : ''

    return {
      title: `Flight Session: ${studentName}${lessonInfo}`,
      description: `Flight session with ${instructorName}\nAircraft: ${aircraftInfo}\nType: ${session.session_type}\nStatus: ${session.status}${session.notes ? `\n\nNotes: ${session.notes}` : ''}`,
      start_time: startDateTime,
      end_time: endDateTime,
      attendees: [
        ...(session.student ? [{
          email: session.student.email,
          displayName: `${session.student.first_name} ${session.student.last_name}`
        }] : []),
        ...(session.instructor ? [{
          email: session.instructor.email,
          displayName: `${session.instructor.first_name} ${session.instructor.last_name}`
        }] : [])
      ],
      status: session.status === 'canceled' ? 'cancelled' : 'confirmed',
      is_flight_session: true,
      flight_session_id: session.id
    }
  }

  private static async getExistingExternalEvent(
    connectionId: string,
    flightSessionId: string
  ): Promise<any> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('external_calendar_events')
      .select('*')
      .eq('calendar_connection_id', connectionId)
      .eq('flight_session_id', flightSessionId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Failed to check existing external event: ${error.message}`)
    }

    return data || null
  }

  private static async getExistingExternalEventByExternalId(
    connectionId: string,
    externalId: string
  ): Promise<any> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data, error } = await supabase
      .from('external_calendar_events')
      .select('*')
      .eq('calendar_connection_id', connectionId)
      .eq('external_id', externalId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check existing external event: ${error.message}`)
    }

    return data || null
  }

  private static async updateExternalEventIfChanged(
    existingEvent: any,
    newEvent: CalendarEvent | FlightSession,
    connectionId: string
  ): Promise<void> {
    // Convert FlightSession to CalendarEvent if needed
    const calendarEvent = 'date' in newEvent 
      ? this.convertFlightSessionToCalendarEvent(newEvent as FlightSession)
      : newEvent as CalendarEvent

    // Check if the event data has changed
    const hasChanged =
      existingEvent.title !== calendarEvent.title ||
      existingEvent.description !== calendarEvent.description ||
      existingEvent.start_time !== calendarEvent.start_time ||
      existingEvent.end_time !== calendarEvent.end_time ||
      existingEvent.location !== calendarEvent.location ||
      existingEvent.status !== calendarEvent.status

    if (hasChanged) {
      await updateCalendarEvent(connectionId, existingEvent.external_id, calendarEvent)
    }
  }

  // Manual sync trigger for a specific connection
  static async triggerManualSync(connectionId: string, userId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      records_processed: 0,
      errors: [],
      metadata: { manual_trigger: true }
    }

    try {
      // Export flight sessions
      const exportResult = await this.exportFlightSessionsToCalendar(connectionId, userId)
      result.records_processed += exportResult.records_processed
      result.errors.push(...exportResult.errors)

      // Import external events
      const importResult = await this.importExternalEventsToApp(connectionId, userId)
      result.records_processed += importResult.records_processed
      result.errors.push(...importResult.errors)

      result.success = result.errors.length === 0

      // Log the operation
      await logSyncOperation(
        connectionId,
        'refresh',
        result.success ? 'success' : 'error',
        result.records_processed,
        result.errors,
        result.metadata
      )

    } catch (error) {
      console.error('Manual sync failed:', error)
      result.success = false
      result.errors.push(`Manual sync failed: ${error}`)
    }

    return result
  }

  // Get sync status for a user
  static async getSyncStatus(userId: string): Promise<any> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: connections, error } = await supabase
      .from('calendar_connections')
      .select(`
        *,
        sync_logs:calendar_sync_logs (
          operation,
          status,
          records_processed,
          started_at,
          completed_at
        )
      `)
      .eq('user_id', userId)
      .order('connected_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch sync status: ${error.message}`)
    }

    return connections
  }

  // Conflict detection - check for scheduling conflicts
  static async detectConflicts(
    userId: string,
    startTime: string,
    endTime: string,
    excludeSessionId?: string
  ): Promise<any[]> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    // Get flight sessions that overlap with the given time range
    const { data: flightSessions, error: flightError } = await supabase
      .from('flight_sessions')
      .select('*')
      .eq('instructor_id', userId)
      .neq('status', 'canceled')
      .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`)

    if (excludeSessionId) {
      flightSessions?.filter(session => session.id !== excludeSessionId)
    }

    // Get external calendar events that overlap
    const { data: externalEvents, error: externalError } = await supabase
      .from('external_calendar_events')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'cancelled')
      .or(`and(start_time.lte.${endTime},end_time.gte.${startTime})`)

    const conflicts = []

    if (flightSessions) {
      conflicts.push(...flightSessions.map(session => ({
        type: 'flight_session',
        id: session.id,
        title: `Flight Session: ${session.date} ${session.start_time}-${session.end_time}`,
        start_time: `${session.date}T${session.start_time}`,
        end_time: `${session.date}T${session.end_time}`
      })))
    }

    if (externalEvents) {
      conflicts.push(...externalEvents.map(event => ({
        type: 'external_event',
        id: event.id,
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time
      })))
    }

    return conflicts
  }
}
