import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { getInstructorInvoices } from "@/lib/instructor-billing-service"
import { sendInvoiceEmail } from "@/lib/invoice-email-service"

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
    const { email } = body

    // Get the invoice
    const invoices = await getInstructorInvoices()
    const invoice = invoices.find(inv => inv.id === params.id)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    // Get invoice line items
    const { data: lineItems } = await supabase
      .from('instructor_invoice_items')
      .select('*')
      .eq('invoice_id', params.id)
      .order('date', { ascending: true })

    const invoiceData = {
      ...invoice,
      line_items: lineItems || []
    }

    // Send email
    const result = await sendInvoiceEmail(invoiceData, email)

    if (result.success) {
      // Update invoice status to 'sent' if it was 'draft'
      if (invoice.status === 'draft') {
        await supabase
          .from('instructor_invoices')
          .update({ 
            status: 'sent',
            updated_at: new Date().toISOString()
          })
          .eq('id', params.id)
      }

      return NextResponse.json({
        success: true,
        message: result.message
      })
    } else {
      return NextResponse.json({
        success: false,
        message: result.message
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending invoice email:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to send invoice email" 
      },
      { status: 500 }
    )
  }
}
