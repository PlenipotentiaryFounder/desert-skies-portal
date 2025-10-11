import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiRouteClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      student_id,
      instructor_id,
      pre_briefing_time,
      flight_time,
      ground_time,
      post_briefing_time,
      due_date,
      notes
    } = body

    // Calculate totals
    const totalFlightTime = pre_briefing_time + flight_time + post_briefing_time
    const totalGroundTime = ground_time

    // Get rates for this student-instructor pair
    let flightRate = 75.00 // default
    let groundRate = 75.00 // default

    const { data: customRate } = await supabase
      .from('student_instructor_rates')
      .select('flight_instruction_rate, ground_instruction_rate')
      .eq('student_id', student_id)
      .eq('instructor_id', instructor_id)
      .eq('is_active', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    if (customRate) {
      flightRate = customRate.flight_instruction_rate
      groundRate = customRate.ground_instruction_rate
    }

    const flightAmount = totalFlightTime * flightRate
    const groundAmount = totalGroundTime * groundRate
    const totalAmount = flightAmount + groundAmount

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('instructor_invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastInvoice && lastInvoice.invoice_number) {
      const match = lastInvoice.invoice_number.match(/DSA-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    const invoiceNumber = `DSA-${nextNumber.toString().padStart(4, '0')}`

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('instructor_invoices')
      .insert({
        invoice_number: invoiceNumber,
        student_id,
        instructor_id,
        flight_hours: totalFlightTime,
        ground_hours: totalGroundTime,
        flight_rate: flightRate,
        ground_rate: groundRate,
        flight_amount: flightAmount,
        ground_amount: groundAmount,
        total_amount: totalAmount,
        due_date,
        status: 'draft',
        notes: notes || null,
        created_by: user.id
      })
      .select()
      .single()

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError)
      throw new Error('Failed to create invoice')
    }

    // Create line items
    const lineItems = []

    if (totalFlightTime > 0) {
      lineItems.push({
        invoice_id: invoice.id,
        description: `Flight Instruction (${totalFlightTime.toFixed(1)} hours)`,
        item_type: 'flight_instruction',
        hours: totalFlightTime,
        rate: flightRate,
        amount: flightAmount,
        date: new Date().toISOString().split('T')[0]
      })
    }

    if (totalGroundTime > 0) {
      lineItems.push({
        invoice_id: invoice.id,
        description: `Ground Instruction (${totalGroundTime.toFixed(1)} hours)`,
        item_type: 'ground_instruction',
        hours: totalGroundTime,
        rate: groundRate,
        amount: groundAmount,
        date: new Date().toISOString().split('T')[0]
      })
    }

    if (lineItems.length > 0) {
      const { error: lineItemError } = await supabase
        .from('instructor_invoice_items')
        .insert(lineItems)

      if (lineItemError) {
        console.error('Error creating line items:', lineItemError)
        // Don't fail the invoice creation if line items fail
      }
    }

    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      invoice_number: invoiceNumber,
      message: `Invoice ${invoiceNumber} created successfully`
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Failed to create invoice" 
      },
      { status: 500 }
    )
  }
}
