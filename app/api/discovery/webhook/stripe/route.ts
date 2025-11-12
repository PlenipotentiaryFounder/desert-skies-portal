import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { completePayment, getDiscoveryFlightById } from '@/lib/discovery-flight-service'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
  })
}

function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }
  return process.env.STRIPE_WEBHOOK_SECRET
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripe()
    const webhookSecret = getWebhookSecret()
    
    const body = await req.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        const discoveryFlightId = session.metadata?.discovery_flight_id
        if (!discoveryFlightId) {
          console.error('No discovery_flight_id in session metadata')
          break
        }

        // Update discovery flight with payment info
        await completePayment(discoveryFlightId, {
          payment_method: 'stripe',
          stripe_customer_id: session.customer as string,
          stripe_payment_intent_id: session.payment_intent as string,
          amount_paid_cents: session.amount_total || 0,
        })

        console.log(`Payment completed for discovery flight ${discoveryFlightId}`)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log(`PaymentIntent succeeded: ${paymentIntent.id}`)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.error(`PaymentIntent failed: ${paymentIntent.id}`)
        
        // Could update discovery flight payment status to 'failed' here
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        console.log(`Customer created: ${customer.id}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


