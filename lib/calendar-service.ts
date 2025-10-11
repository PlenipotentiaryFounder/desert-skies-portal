"use server"

import { CalendarOAuthService, type OAuthProvider, type CalendarConnection } from "./calendar-oauth-service"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// Types for calendar events
export interface CalendarEvent {
  id?: string
  external_id?: string
  title: string
  description?: string
  start_time: string // ISO string
  end_time: string // ISO string
  location?: string
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  status?: 'confirmed' | 'tentative' | 'cancelled'
  is_flight_session?: boolean
  flight_session_id?: string
}

export interface ExternalCalendarEvent {
  id: string
  external_id: string
  user_id: string
  calendar_connection_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  attendees: any[]
  status: string
  is_flight_session: boolean
  flight_session_id?: string
  created_at: string
  updated_at: string
}

export interface SyncResult {
  success: boolean
  records_processed: number
  errors: string[]
  metadata?: Record<string, any>
}

export class CalendarService {
  // Get calendar events from external provider
  static async getCalendarEvents(
    connectionId: string,
    startTime?: string,
    endTime?: string,
    maxResults: number = 100
  ): Promise<CalendarEvent[]> {
    const accessToken = await CalendarOAuthService.getValidAccessToken(connectionId)

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      throw new Error('Calendar connection not found')
    }

    const provider = connection.provider as OAuthProvider

    switch (provider) {
      case 'google':
        return this.getGoogleCalendarEvents(accessToken, startTime, endTime, maxResults)

      case 'outlook':
        return this.getOutlookCalendarEvents(accessToken, startTime, endTime, maxResults)

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  // Create calendar event in external provider
  static async createCalendarEvent(
    connectionId: string,
    event: CalendarEvent
  ): Promise<string> {
    const accessToken = await CalendarOAuthService.getValidAccessToken(connectionId)

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      throw new Error('Calendar connection not found')
    }

    const provider = connection.provider as OAuthProvider

    switch (provider) {
      case 'google':
        return this.createGoogleCalendarEvent(accessToken, event)

      case 'outlook':
        return this.createOutlookCalendarEvent(accessToken, event)

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  // Update calendar event in external provider
  static async updateCalendarEvent(
    connectionId: string,
    externalEventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void> {
    const accessToken = await CalendarOAuthService.getValidAccessToken(connectionId)

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      throw new Error('Calendar connection not found')
    }

    const provider = connection.provider as OAuthProvider

    switch (provider) {
      case 'google':
        await this.updateGoogleCalendarEvent(accessToken, externalEventId, event)
        break

      case 'outlook':
        await this.updateOutlookCalendarEvent(accessToken, externalEventId, event)
        break

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  // Delete calendar event from external provider
  static async deleteCalendarEvent(
    connectionId: string,
    externalEventId: string
  ): Promise<void> {
    const accessToken = await CalendarOAuthService.getValidAccessToken(connectionId)

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { data: connection, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error || !connection) {
      throw new Error('Calendar connection not found')
    }

    const provider = connection.provider as OAuthProvider

    switch (provider) {
      case 'google':
        await this.deleteGoogleCalendarEvent(accessToken, externalEventId)
        break

      case 'outlook':
        await this.deleteOutlookCalendarEvent(accessToken, externalEventId)
        break

      default:
        throw new Error(`Unsupported provider: ${provider}`)
    }
  }

  // Google Calendar API methods
  private static async getGoogleCalendarEvents(
    accessToken: string,
    startTime?: string,
    endTime?: string,
    maxResults: number = 100
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      singleEvents: 'true',
      orderBy: 'startTime'
    })

    if (startTime) params.append('timeMin', startTime)
    if (endTime) params.append('timeMax', endTime)

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`)
    }

    const data = await response.json()

    return data.items.map((item: any) => ({
      id: item.id,
      external_id: item.id,
      title: item.summary,
      description: item.description,
      start_time: item.start.dateTime || item.start.date,
      end_time: item.end.dateTime || item.end.date,
      location: item.location,
      attendees: item.attendees?.map((att: any) => ({
        email: att.email,
        displayName: att.displayName,
        responseStatus: att.responseStatus
      })) || [],
      status: item.status
    }))
  }

  private static async createGoogleCalendarEvent(
    accessToken: string,
    event: CalendarEvent
  ): Promise<string> {
    const googleEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.start_time,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.end_time,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      location: event.location,
      attendees: event.attendees?.map(att => ({
        email: att.email,
        displayName: att.displayName
      }))
    }

    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(googleEvent)
      }
    )

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.id
  }

  private static async updateGoogleCalendarEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void> {
    const updateData: any = {}

    if (event.title) updateData.summary = event.title
    if (event.description) updateData.description = event.description
    if (event.start_time) updateData.start = { dateTime: event.start_time }
    if (event.end_time) updateData.end = { dateTime: event.end_time }
    if (event.location) updateData.location = event.location
    if (event.status) updateData.status = event.status

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`)
    }
  }

  private static async deleteGoogleCalendarEvent(
    accessToken: string,
    eventId: string
  ): Promise<void> {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.statusText}`)
    }
  }

  // Outlook Calendar API methods
  private static async getOutlookCalendarEvents(
    accessToken: string,
    startTime?: string,
    endTime?: string,
    maxResults: number = 100
  ): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({
      $top: maxResults.toString(),
      $orderby: 'start/dateTime'
    })

    if (startTime) params.append('$filter', `start/dateTime ge '${startTime}'`)
    if (endTime) params.append('$filter', `end/dateTime le '${endTime}'`)

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.statusText}`)
    }

    const data = await response.json()

    return data.value.map((item: any) => ({
      id: item.id,
      external_id: item.id,
      title: item.subject,
      description: item.body?.content,
      start_time: item.start.dateTime,
      end_time: item.end.dateTime,
      location: item.location?.displayName,
      attendees: item.attendees?.map((att: any) => ({
        email: att.emailAddress.address,
        displayName: att.emailAddress.name,
        responseStatus: att.status.response
      })) || [],
      status: item.showAs === 1 ? 'tentative' : item.showAs === 2 ? 'cancelled' : 'confirmed'
    }))
  }

  private static async createOutlookCalendarEvent(
    accessToken: string,
    event: CalendarEvent
  ): Promise<string> {
    const outlookEvent = {
      subject: event.title,
      body: {
        contentType: 'text',
        content: event.description || ''
      },
      start: {
        dateTime: event.start_time,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: event.end_time,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      location: event.location ? { displayName: event.location } : undefined,
      attendees: event.attendees?.map(att => ({
        emailAddress: {
          address: att.email,
          name: att.displayName
        },
        type: 'required'
      }))
    }

    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(outlookEvent)
      }
    )

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.id
  }

  private static async updateOutlookCalendarEvent(
    accessToken: string,
    eventId: string,
    event: Partial<CalendarEvent>
  ): Promise<void> {
    const updateData: any = {}

    if (event.title) updateData.subject = event.title
    if (event.description) updateData.body = { contentType: 'text', content: event.description }
    if (event.start_time) updateData.start = { dateTime: event.start_time }
    if (event.end_time) updateData.end = { dateTime: event.end_time }
    if (event.location) updateData.location = { displayName: event.location }
    if (event.status) updateData.showAs = event.status === 'cancelled' ? 2 : event.status === 'tentative' ? 1 : 0

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      }
    )

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.statusText}`)
    }
  }

  private static async deleteOutlookCalendarEvent(
    accessToken: string,
    eventId: string
  ): Promise<void> {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Outlook Calendar API error: ${response.statusText}`)
    }
  }

  // Save external calendar event to database
  static async saveExternalCalendarEvent(
    userId: string,
    connectionId: string,
    externalEvent: CalendarEvent
  ): Promise<ExternalCalendarEvent> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const eventData = {
      user_id: userId,
      calendar_connection_id: connectionId,
      external_id: externalEvent.external_id!,
      title: externalEvent.title,
      description: externalEvent.description,
      start_time: externalEvent.start_time,
      end_time: externalEvent.end_time,
      location: externalEvent.location,
      attendees: externalEvent.attendees || [],
      status: externalEvent.status || 'confirmed',
      is_flight_session: externalEvent.is_flight_session || false,
      flight_session_id: externalEvent.flight_session_id
    }

    const { data, error } = await supabase
      .from('external_calendar_events')
      .upsert(eventData, {
        onConflict: 'external_id,calendar_connection_id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to save external calendar event: ${error.message}`)
    }

    return data as ExternalCalendarEvent
  }

  // Get external calendar events for a user
  static async getExternalCalendarEvents(
    userId: string,
    startTime?: string,
    endTime?: string
  ): Promise<ExternalCalendarEvent[]> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    let query = supabase
      .from('external_calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: true })

    if (startTime) {
      query = query.gte('start_time', startTime)
    }

    if (endTime) {
      query = query.lte('end_time', endTime)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch external calendar events: ${error.message}`)
    }

    return data as ExternalCalendarEvent[]
  }

  // Delete external calendar event from database
  static async deleteExternalCalendarEvent(externalEventId: string): Promise<void> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const { error } = await supabase
      .from('external_calendar_events')
      .delete()
      .eq('id', externalEventId)

    if (error) {
      throw new Error(`Failed to delete external calendar event: ${error.message}`)
    }
  }

  // Log sync operation
  static async logSyncOperation(
    connectionId: string,
    operation: 'import' | 'export' | 'refresh' | 'webhook',
    status: 'success' | 'error' | 'partial',
    recordsProcessed: number = 0,
    errors: string[] = [],
    metadata?: Record<string, any>
  ): Promise<void> {
    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)

    const logData = {
      calendar_connection_id: connectionId,
      operation,
      status,
      records_processed: recordsProcessed,
      errors,
      metadata: metadata || {},
      completed_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('calendar_sync_logs')
      .insert(logData)

    if (error) {
      console.error('Failed to log sync operation:', error)
    }
  }
}
