import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { createPaymentIntent, processInvoicePayment } from "@/lib/payment-service"
import { getInstructorInvoices } from "@/lib/instructor-billing-service"

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createApiRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { amount, notes } = body

    // Get the invoice
    const invoices = await getInstructorInvoices()
    const invoice = invoices.find(inv => inv.id === params.id)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 })
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent(params.id, {
      amount: Math.round((amount || invoice.total_amount) * 100), // Convert to cents
      currency: 'usd',
      customer_email: invoice.student?.email || '',
      description: `Payment for Invoice #${invoice.invoice_number}`,
      metadata: {
        invoice_id: params.id,
        student_id: invoice.student_id,
        instructor_id: invoice.instructor_id,
        notes: notes || ''
      }
    })

    if (!paymentIntent.success) {
      return NextResponse.json({
        success: false,
        error: paymentIntent.error
      }, { status: 500 })
    }

    // In a real implementation, you would return the client_secret to the frontend
    // The frontend would then use Stripe Elements to collect payment details
    // For demo purposes, we'll simulate a successful payment
    setTimeout(async () => {
      try {
        await processInvoicePayment(params.id, 'pi_mock_payment_intent', 'stripe')
      } catch (error) {
        console.error('Error processing simulated payment:', error)
      }
    }, 2000)

    return NextResponse.json({
      success: true,
      client_secret: paymentIntent.client_secret,
      message: "Payment intent created successfully"
    })
  } catch (error) {
    console.error('Error creating Stripe payment:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create payment intent" 
      },
      { status: 500 }
    )
  }
}
