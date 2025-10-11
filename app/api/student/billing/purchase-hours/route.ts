import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  })
}

export async function POST(request: NextRequest) {
  try {
    const { flightHours, groundHours, paymentMethodId } = await request.json()

    // Validate input
    if (!flightHours || !groundHours) {
      return NextResponse.json(
        { error: 'Flight hours and ground hours are required' },
        { status: 400 }
      )
    }

    const flightHoursNum = parseFloat(flightHours)
    const groundHoursNum = parseFloat(groundHours)

    if (flightHoursNum <= 0 || groundHoursNum <= 0) {
      return NextResponse.json(
        { error: 'Hours must be greater than 0' },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = createClient(await cookies())
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's student profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      )
    }

    // Get current rates from database (or use defaults if not configured)
    const flightRate = 75.00 // Default rate - should come from instructor rates
    const groundRate = 75.00 // Default rate - should come from instructor rates

    const flightCost = flightHoursNum * flightRate
    const groundCost = groundHoursNum * groundRate
    const totalAmount = Math.round((flightCost + groundCost) * 100) // Convert to cents

    // Create invoice record
    const invoiceData = {
      student_id: profile.id,
      flight_hours: flightHoursNum,
      ground_hours: groundHoursNum,
      flight_rate: flightRate,
      ground_rate: groundRate,
      total_amount: (flightCost + groundCost),
      status: 'pending',
      created_at: new Date().toISOString()
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('student_invoices')
      .insert(invoiceData)
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      return NextResponse.json(
        { error: 'Failed to create invoice' },
        { status: 500 }
      )
    }

    // Create Stripe Payment Intent
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: {
        invoice_id: invoice.id.toString(),
        student_id: profile.id.toString(),
        flight_hours: flightHoursNum.toString(),
        ground_hours: groundHoursNum.toString(),
        type: 'prepaid_hours_purchase'
      },
      automatic_payment_methods: {
        enabled: true,
      },
      // Enable Apple Pay and other wallet payments
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    })

    // Update invoice with payment intent ID
    await supabase
      .from('student_invoices')
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: totalAmount,
      currency: 'usd',
      flightHours: flightHoursNum,
      groundHours: groundHoursNum,
      totalCost: flightCost + groundCost
    })

  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
