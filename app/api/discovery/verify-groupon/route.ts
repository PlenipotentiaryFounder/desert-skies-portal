import { NextRequest, NextResponse } from 'next/server'
import { verifyGrouponCode, redeemGrouponCode, getDiscoveryFlightById } from '@/lib/discovery-flight-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { discovery_flight_id, groupon_code } = body

    if (!discovery_flight_id || !groupon_code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get discovery flight to get email
    const discoveryFlight = await getDiscoveryFlightById(discovery_flight_id)
    if (!discoveryFlight) {
      return NextResponse.json({ error: 'Discovery flight not found' }, { status: 404 })
    }

    // Verify Groupon code
    const verification = await verifyGrouponCode(groupon_code, discoveryFlight.email)

    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || 'Invalid Groupon code' }, { status: 400 })
    }

    // Redeem the code
    await redeemGrouponCode(groupon_code, discovery_flight_id, discoveryFlight.email)

    return NextResponse.json({ 
      success: true,
      message: 'Groupon code verified and redeemed successfully',
    }, { status: 200 })
  } catch (error) {
    console.error('Error verifying Groupon code:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


