"use server"

import { format } from "date-fns"
import type { InstructorInvoice, InstructorInvoiceItem } from "@/lib/instructor-billing-service"

export interface InvoicePDFData extends InstructorInvoice {
  line_items: InstructorInvoiceItem[]
  company: {
    name: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    email: string
    website: string
  }
}

export async function generateInvoicePDF(invoice: InvoicePDFData): Promise<Buffer> {
  // This would typically use a library like puppeteer or jsPDF
  // For now, we'll create an HTML template that can be converted to PDF
  
  const htmlTemplate = generateInvoiceHTML(invoice)
  
  // In a real implementation, you would use puppeteer or similar:
  // const browser = await puppeteer.launch()
  // const page = await browser.newPage()
  // await page.setContent(htmlTemplate)
  // const pdf = await page.pdf({ format: 'A4', printBackground: true })
  // await browser.close()
  // return pdf
  
  // For now, return the HTML as a buffer for demonstration
  return Buffer.from(htmlTemplate, 'utf-8')
}

function generateInvoiceHTML(invoice: InvoicePDFData): string {
  const subtotal = invoice.flight_amount + invoice.ground_amount
  const tax = 0 // No tax for now
  const total = subtotal + tax

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
        }
        
        .company-details {
            color: #666;
            line-height: 1.4;
        }
        
        .invoice-info {
            text-align: right;
            flex: 1;
        }
        
        .invoice-title {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .invoice-date {
            color: #666;
        }
        
        .billing-section {
            display: flex;
            justify-content: space-between;
            margin: 40px 0;
        }
        
        .billing-info {
            flex: 1;
            padding-right: 20px;
        }
        
        .billing-title {
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .billing-details {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .student-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .items-table th {
            background: #1e40af;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 12px;
        }
        
        .items-table th:last-child,
        .items-table td:last-child {
            text-align: right;
        }
        
        .items-table td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .items-table tr:nth-child(even) {
            background: #f8fafc;
        }
        
        .items-table tr:hover {
            background: #f1f5f9;
        }
        
        .item-description {
            font-weight: 500;
            margin-bottom: 3px;
        }
        
        .item-type {
            color: #64748b;
            font-size: 12px;
            text-transform: capitalize;
        }
        
        .totals-section {
            margin-top: 30px;
            display: flex;
            justify-content: flex-end;
        }
        
        .totals-table {
            width: 300px;
        }
        
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .totals-row:last-child {
            border-bottom: 2px solid #1e40af;
            font-weight: bold;
            font-size: 18px;
            color: #1e40af;
            padding: 15px 0 10px 0;
        }
        
        .subtotal-row {
            font-weight: 500;
        }
        
        .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #666;
        }
        
        .payment-terms {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .payment-terms h3 {
            color: #92400e;
            margin-bottom: 10px;
        }
        
        .payment-terms p {
            color: #92400e;
            margin-bottom: 5px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-draft { background: #f3f4f6; color: #374151; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
        .status-cancelled { background: #fef3c7; color: #92400e; }
        
        @media print {
            .container {
                padding: 20px;
            }
            
            body {
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-info">
                <div class="company-name">${invoice.company.name}</div>
                <div class="company-details">
                    ${invoice.company.address}<br>
                    ${invoice.company.city}, ${invoice.company.state} ${invoice.company.zip}<br>
                    Phone: ${invoice.company.phone}<br>
                    Email: ${invoice.company.email}<br>
                    ${invoice.company.website}
                </div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">#${invoice.invoice_number}</div>
                <div class="invoice-date">Date: ${format(new Date(invoice.created_at), "MMMM d, yyyy")}</div>
                <div class="invoice-date">Due: ${format(new Date(invoice.due_date), "MMMM d, yyyy")}</div>
                <div style="margin-top: 10px;">
                    <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                </div>
            </div>
        </div>
        
        <!-- Billing Information -->
        <div class="billing-section">
            <div class="billing-info">
                <div class="billing-title">Bill To</div>
                <div class="billing-details">
                    <div class="student-name">${invoice.student?.first_name} ${invoice.student?.last_name}</div>
                    <div>${invoice.student?.email}</div>
                </div>
            </div>
            <div class="billing-info">
                <div class="billing-title">Instructor</div>
                <div class="billing-details">
                    <div class="student-name">${invoice.instructor?.first_name} ${invoice.instructor?.last_name}</div>
                    <div>${invoice.instructor?.email}</div>
                </div>
            </div>
        </div>
        
        <!-- Line Items -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Hours</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.line_items.map(item => `
                    <tr>
                        <td>
                            <div class="item-description">${item.description}</div>
                            <div class="item-type">${format(new Date(item.date), "MMM d, yyyy")}</div>
                        </td>
                        <td>
                            <span class="item-type">${item.item_type.replace('_', ' ')}</span>
                        </td>
                        <td>${item.hours.toFixed(1)}</td>
                        <td>$${item.rate.toFixed(2)}</td>
                        <td>$${item.amount.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <!-- Totals -->
        <div class="totals-section">
            <div class="totals-table">
                <div class="totals-row">
                    <span>Flight Instruction (${invoice.flight_hours.toFixed(1)} hrs):</span>
                    <span>$${invoice.flight_amount.toFixed(2)}</span>
                </div>
                <div class="totals-row">
                    <span>Ground Instruction (${invoice.ground_hours.toFixed(1)} hrs):</span>
                    <span>$${invoice.ground_amount.toFixed(2)}</span>
                </div>
                <div class="totals-row subtotal-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="totals-row">
                    <span>Tax:</span>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div class="totals-row">
                    <span>Total:</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <!-- Payment Terms -->
        <div class="payment-terms">
            <h3>Payment Terms & Information</h3>
            <p><strong>Payment Due:</strong> ${format(new Date(invoice.due_date), "MMMM d, yyyy")}</p>
            <p><strong>Payment Methods:</strong> Cash, Check, Credit Card, or Account Balance</p>
            <p><strong>Late Fee:</strong> 1.5% per month on overdue balances</p>
            ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>Thank you for choosing ${invoice.company.name} for your flight training!</p>
            <p>Questions? Contact us at ${invoice.company.email} or ${invoice.company.phone}</p>
        </div>
    </div>
</body>
</html>`
}

export async function getCompanyInfo() {
  return {
    name: "Desert Skies Aviation",
    address: "1234 Airport Way",
    city: "Phoenix",
    state: "AZ",
    zip: "85001",
    phone: "(602) 555-0123",
    email: "billing@desertskiesaviationaz.com",
    website: "www.desertskiesaviationaz.com"
  }
}
