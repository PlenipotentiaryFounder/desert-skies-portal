import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/api-route"
import { getInstructorInvoices } from "@/lib/instructor-billing-service"
import { generateInvoicePDF, getCompanyInfo } from "@/lib/invoice-pdf-service"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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
      line_items: lineItems || [],
      company: getCompanyInfo()
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
