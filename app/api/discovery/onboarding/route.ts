import { NextRequest, NextResponse } from 'next/server'
import {
  createDiscoveryFlight,
  getDiscoveryFlightByEmail,
  updateDiscoveryFlight,
  completePersonalInfo,
} from '@/lib/discovery-flight-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      action,
      email,
      first_name,
      last_name,
      phone,
      special_requests,
      booking_source,
      groupon_code,
    } = body

    if (action === 'create_or_update') {
      // Check if discovery flight already exists
      const existing = await getDiscoveryFlightByEmail(email)

      let discoveryFlight

      if (existing) {
        // Update existing
        discoveryFlight = await completePersonalInfo(existing.id, {
          first_name,
          last_name,
          phone,
        })

        if (special_requests) {
          discoveryFlight = await updateDiscoveryFlight(existing.id, {
            special_requests,
          })
        }
      } else {
        // Create new
        discoveryFlight = await createDiscoveryFlight({
          email,
          first_name,
          last_name,
          phone,
          special_requests,
          booking_source: booking_source || 'website',
          groupon_code,
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
          user_agent: req.headers.get('user-agent') || undefined,
        })
      }

      return NextResponse.json({ discovery_flight: discoveryFlight }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in discovery onboarding API:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


