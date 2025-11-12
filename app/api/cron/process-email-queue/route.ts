import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendDiscoveryFlightConfirmation, sendDiscoveryFlightReminder, sendDiscoveryFlightFollowUp } from '@/lib/email-service'
import { getDiscoveryFlightById } from '@/lib/discovery-flight-service'

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
// Authorization should be done via a secret token

export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get pending emails that are due to be sent
    const { data: pendingEmails, error } = await supabase
      .from('discovery_flight_email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_send_at', new Date().toISOString())
      .lt('attempt_count', 3) // Max 3 attempts
      .order('scheduled_send_at', { ascending: true })
      .limit(50) // Process 50 at a time

    if (error) {
      console.error('Error fetching email queue:', error)
      return NextResponse.json({ error: 'Failed to fetch email queue' }, { status: 500 })
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return NextResponse.json({ message: 'No emails to process', processed: 0 }, { status: 200 })
    }

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
    }

    // Process each email
    for (const email of pendingEmails) {
      try {
        // Mark as sending
        await supabase
          .from('discovery_flight_email_queue')
          .update({
            status: 'sending',
            last_attempt_at: new Date().toISOString(),
            attempt_count: email.attempt_count + 1,
          })
          .eq('id', email.id)

        // Get discovery flight data
        const discoveryFlight = await getDiscoveryFlightById(email.discovery_flight_id)
        if (!discoveryFlight) {
          throw new Error('Discovery flight not found')
        }

        let sendResult

        // Send appropriate email based on type
        switch (email.email_type) {
          case 'confirmation':
            sendResult = await sendDiscoveryFlightConfirmation({
              email: discoveryFlight.email,
              first_name: discoveryFlight.first_name,
              last_name: discoveryFlight.last_name,
            })
            break

          case 'reminder_24h':
          case 'reminder_1h':
            if (!discoveryFlight.scheduled_date || !discoveryFlight.scheduled_time) {
              throw new Error('Flight not scheduled')
            }
            sendResult = await sendDiscoveryFlightReminder({
              email: discoveryFlight.email,
              first_name: discoveryFlight.first_name,
              scheduled_date: discoveryFlight.scheduled_date,
              scheduled_time: discoveryFlight.scheduled_time,
              instructor_name: 'Your Instructor', // Would fetch from profiles
              hours_until: email.email_type === 'reminder_24h' ? 24 : 1,
            })
            break

          case 'follow_up_immediate':
          case 'follow_up_3day':
          case 'follow_up_7day':
            sendResult = await sendDiscoveryFlightFollowUp({
              email: discoveryFlight.email,
              first_name: discoveryFlight.first_name,
              instructor_name: 'Your Instructor', // Would fetch from profiles
            })
            break

          default:
            throw new Error(`Unknown email type: ${email.email_type}`)
        }

        if (sendResult.success) {
          // Mark as sent
          await supabase
            .from('discovery_flight_email_queue')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              provider_message_id: sendResult.message_id,
            })
            .eq('id', email.id)

          // Update discovery flight email flags
          const updateFields: any = {}
          if (email.email_type === 'confirmation') {
            updateFields.confirmation_email_sent = true
            updateFields.confirmation_email_sent_at = new Date().toISOString()
          } else if (email.email_type.startsWith('reminder')) {
            updateFields.reminder_email_sent = true
            updateFields.reminder_email_sent_at = new Date().toISOString()
          } else if (email.email_type.startsWith('follow_up')) {
            updateFields.follow_up_email_sent = true
            updateFields.follow_up_email_sent_at = new Date().toISOString()
          }

          if (Object.keys(updateFields).length > 0) {
            await supabase
              .from('discovery_flights')
              .update(updateFields)
              .eq('id', email.discovery_flight_id)
          }

          results.sent++
        } else {
          throw new Error(sendResult.error || 'Failed to send email')
        }

        results.processed++
      } catch (emailError) {
        console.error(`Error processing email ${email.id}:`, emailError)
        
        // Mark as failed
        await supabase
          .from('discovery_flight_email_queue')
          .update({
            status: email.attempt_count + 1 >= email.max_attempts ? 'failed' : 'pending',
            error_message: emailError instanceof Error ? emailError.message : 'Unknown error',
          })
          .eq('id', email.id)

        results.failed++
        results.processed++
      }
    }

    return NextResponse.json({
      message: 'Email queue processed',
      ...results,
    }, { status: 200 })
  } catch (error) {
    console.error('Error processing email queue:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


