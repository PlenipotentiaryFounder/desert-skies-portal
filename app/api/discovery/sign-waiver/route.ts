import { NextRequest, NextResponse } from 'next/server'
import { completeLiabilityWaiver } from '@/lib/discovery-flight-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { discovery_flight_id, signature_name, signature_data } = body

    if (!discovery_flight_id || !signature_name || !signature_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const signatureMetadata = {
      name: signature_name,
      signature: signature_data,
      timestamp: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    }

    const discoveryFlight = await completeLiabilityWaiver(discovery_flight_id, signatureMetadata)

    return NextResponse.json({ discovery_flight: discoveryFlight }, { status: 200 })
  } catch (error) {
    console.error('Error signing waiver:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


