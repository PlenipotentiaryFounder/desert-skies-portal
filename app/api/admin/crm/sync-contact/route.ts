import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDiscoveryFlightById, updateDiscoveryFlight } from '@/lib/discovery-flight-service'
import { syncDiscoveryFlightToCRM } from '@/lib/crm-service'

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
    const { discovery_flight_id, outlook_access_token } = body

    if (!discovery_flight_id) {
      return NextResponse.json({ error: 'Missing discovery flight ID' }, { status: 400 })
    }

    // Get discovery flight
    const discoveryFlight = await getDiscoveryFlightById(discovery_flight_id)
    if (!discoveryFlight) {
      return NextResponse.json({ error: 'Discovery flight not found' }, { status: 404 })
    }

    // Sync to CRM
    const results = await syncDiscoveryFlightToCRM(discoveryFlight, {
      outlookAccessToken: outlook_access_token || process.env.OUTLOOK_ACCESS_TOKEN,
    })

    // Update discovery flight with CRM IDs
    const updates: any = {}
    
    if (results.outlook?.success && results.outlook.contact_id) {
      updates.outlook_contact_id = results.outlook.contact_id
      updates.outlook_synced_at = new Date().toISOString()
    }

    if (results.apple?.success && results.apple.contact_id) {
      updates.apple_contact_id = results.apple.contact_id
      updates.apple_synced_at = new Date().toISOString()
    }

    if (Object.keys(updates).length > 0) {
      await updateDiscoveryFlight(discovery_flight_id, updates)
    }

    return NextResponse.json({
      success: true,
      results,
    }, { status: 200 })
  } catch (error) {
    console.error('Error syncing to CRM:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


