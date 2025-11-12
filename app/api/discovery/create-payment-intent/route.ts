import { NextRequest, NextResponse } from 'next/server'
import { getDiscoveryFlightById } from '@/lib/discovery-flight-service'
import Stripe from 'stripe'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { discovery_flight_id } = body

    if (!discovery_flight_id) {
      return NextResponse.json({ error: 'Missing discovery flight ID' }, { status: 400 })
    }

    const stripe = getStripe()

    // Get discovery flight
    const discoveryFlight = await getDiscoveryFlightById(discovery_flight_id)
    if (!discoveryFlight) {
      return NextResponse.json({ error: 'Discovery flight not found' }, { status: 404 })
    }

    // Create or retrieve Stripe customer
    let customerId = discoveryFlight.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: discoveryFlight.email,
        name: `${discoveryFlight.first_name} ${discoveryFlight.last_name}`,
        phone: discoveryFlight.phone,
        metadata: {
          discovery_flight_id: discoveryFlight.id,
          booking_source: discoveryFlight.booking_source,
        },
      })
      customerId = customer.id

      // Update discovery flight with customer ID
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/discovery/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discovery_flight_id,
          stripe_customer_id: customerId,
        }),
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Discovery Flight',
              description: '30 minutes of flight time with a certified instructor',
              images: ['https://desertskiesaviationaz.com/images/discovery-flight.jpg'], // Add your image URL
            },
            unit_amount: 19900, // $199.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/discovery/${Buffer.from(discoveryFlight.email).toString('base64')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/discovery/${Buffer.from(discoveryFlight.email).toString('base64')}?payment=cancelled`,
      metadata: {
        discovery_flight_id: discoveryFlight.id,
        customer_email: discoveryFlight.email,
      },
    })

    return NextResponse.json({ 
      checkout_url: session.url,
      session_id: session.id,
    }, { status: 200 })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


