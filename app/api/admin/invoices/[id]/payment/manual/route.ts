import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
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
    const { payment_method, amount, notes } = body

    // Get the invoice
    const invoices = await getInstructorInvoices()
    const invoice = invoices.find(inv => inv.id === params.id)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 })
    }

    const paymentAmount = amount || invoice.total_amount

    // Update invoice status
    const newStatus = paymentAmount >= invoice.total_amount ? 'paid' : 'sent'
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    if (newStatus === 'paid') {
      updateData.paid_date = new Date().toISOString().split('T')[0]
      updateData.payment_method = payment_method
    }

    if (notes) {
      updateData.notes = notes
    }

    const { error: updateError } = await supabase
      .from('instructor_invoices')
      .update(updateData)
      .eq('id', params.id)

    if (updateError) {
      throw new Error('Failed to update invoice')
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('instructor_billing_transactions')
      .insert({
        student_id: invoice.student_id,
        instructor_id: invoice.instructor_id,
        transaction_type: 'cash_credit',
        cash_amount: paymentAmount,
        description: `${payment_method === 'cash' ? 'Cash' : 'Check'} payment for Invoice #${invoice.invoice_number}`,
        reference_type: 'invoice_payment',
        reference_id: params.id,
        metadata: {
          payment_method,
          manual_entry: true,
          processed_by: user.id,
          notes
        }
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
      // Don't fail the payment if transaction recording fails
    }

    const message = newStatus === 'paid' 
      ? `Payment of $${paymentAmount.toFixed(2)} recorded successfully via ${payment_method}`
      : `Partial payment of $${paymentAmount.toFixed(2)} recorded via ${payment_method}. Remaining balance: $${(invoice.total_amount - paymentAmount).toFixed(2)}`

    return NextResponse.json({
      success: true,
      message
    })
  } catch (error) {
    console.error('Error processing manual payment:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process manual payment" 
      },
      { status: 500 }
    )
  }
}
