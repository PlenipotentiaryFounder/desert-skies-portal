import { NextRequest, NextResponse } from 'next/server'
import { scheduleDiscoveryFlight } from '@/lib/discovery-flight-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`role:roles(name)`)
      .eq('user_id', user.id)

    const roles = userRoles?.map(ur => ur.role?.name).filter(Boolean) || []
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const {
      discovery_flight_id,
      scheduled_date,
      scheduled_time,
      scheduled_instructor_id,
      scheduled_aircraft_id,
    } = body

    if (!discovery_flight_id || !scheduled_date || !scheduled_time || !scheduled_instructor_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const discoveryFlight = await scheduleDiscoveryFlight(discovery_flight_id, {
      scheduled_date,
      scheduled_time,
      scheduled_instructor_id,
      scheduled_aircraft_id,
    })

    return NextResponse.json({ discovery_flight: discoveryFlight }, { status: 200 })
  } catch (error) {
    console.error('Error scheduling discovery flight:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


