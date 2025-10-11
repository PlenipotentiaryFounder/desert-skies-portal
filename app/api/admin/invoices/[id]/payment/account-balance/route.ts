import { NextRequest, NextResponse } from "next/server"
import { createApiRouteClient } from "@/lib/supabase/api-route"
import { payFromAccountBalance } from "@/lib/payment-service"
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
    const { notes } = body

    // Get the invoice
    const invoices = await getInstructorInvoices()
    const invoice = invoices.find(inv => inv.id === params.id)

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: "Invoice is already paid" }, { status: 400 })
    }

    // Process payment from account balance
    const result = await payFromAccountBalance(
      params.id,
      invoice.student_id,
      invoice.instructor_id
    )

    if (result.success) {
      // Add notes if provided
      if (notes) {
        await supabase
          .from('instructor_invoices')
          .update({
            notes: notes,
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
        error: result.error,
        message: result.message
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing account balance payment:', error)
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to process account balance payment" 
      },
      { status: 500 }
    )
  }
}
