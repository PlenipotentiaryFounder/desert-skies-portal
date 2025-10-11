"use server"

import { format } from "date-fns"
import type { InstructorInvoice } from "@/lib/instructor-billing-service"
import { generateInvoicePDF, getCompanyInfo, type InvoicePDFData } from "./invoice-pdf-service"

export interface EmailOptions {
  to: string
  subject: string
  htmlContent: string
  attachments?: {
    filename: string
    content: Buffer
    contentType: string
  }[]
}

export async function sendInvoiceEmail(
  invoice: InstructorInvoice & { line_items: any[] },
  recipientEmail?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const company = getCompanyInfo()
    const invoiceData: InvoicePDFData = {
      ...invoice,
      company
    }

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoiceData)
    
    // Prepare email
    const emailOptions: EmailOptions = {
      to: recipientEmail || invoice.student?.email || '',
      subject: `Invoice ${invoice.invoice_number} from ${company.name}`,
      htmlContent: generateInvoiceEmailHTML(invoice, company),
      attachments: [
        {
          filename: `Invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    }

    // In a real implementation, you would use a service like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Nodemailer with SMTP
    
    // Example with Resend:
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // const result = await resend.emails.send({
    //   from: `${company.name} <${company.email}>`,
    //   to: emailOptions.to,
    //   subject: emailOptions.subject,
    //   html: emailOptions.htmlContent,
    //   attachments: emailOptions.attachments
    // })

    console.log('Email would be sent with options:', {
      to: emailOptions.to,
      subject: emailOptions.subject,
      attachmentCount: emailOptions.attachments?.length || 0
    })

    // Simulate successful email send
    return {
      success: true,
      message: `Invoice ${invoice.invoice_number} sent successfully to ${emailOptions.to}`
    }
  } catch (error) {
    console.error('Error sending invoice email:', error)
    return {
      success: false,
      message: `Failed to send invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

function generateInvoiceEmailHTML(
  invoice: InstructorInvoice,
  company: ReturnType<typeof getCompanyInfo>
): string {
  const dueDate = format(new Date(invoice.due_date), "MMMM d, yyyy")
  const invoiceDate = format(new Date(invoice.created_at), "MMMM d, yyyy")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoice_number}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        
        .email-container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .company-name {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .company-tagline {
            color: #64748b;
            font-style: italic;
        }
        
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
        }
        
        .invoice-summary {
            background: #f1f5f9;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
        }
        
        .invoice-number {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
        }
        
        .amount {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
        }
        
        .breakdown {
            margin: 20px 0;
        }
        
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .breakdown-item:last-child {
            border-bottom: none;
            font-weight: bold;
            font-size: 18px;
            color: #1e40af;
            padding-top: 15px;
        }
        
        .payment-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
        }
        
        .payment-info h3 {
            color: #92400e;
            margin-bottom: 15px;
        }
        
        .payment-methods {
            list-style: none;
            padding: 0;
        }
        
        .payment-methods li {
            padding: 5px 0;
            color: #92400e;
        }
        
        .payment-methods li::before {
            content: "✓ ";
            color: #059669;
            font-weight: bold;
        }
        
        .cta-button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        
        .cta-button:hover {
            background: #1e40af;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #64748b;
            font-size: 14px;
        }
        
        .contact-info {
            margin: 15px 0;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-draft { background: #f3f4f6; color: #374151; }
        .status-overdue { background: #fee2e2; color: #dc2626; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="company-name">${company.name}</div>
            <div class="company-tagline">Professional Flight Training</div>
        </div>
        
        <div class="greeting">
            Hello ${invoice.student?.first_name || 'Student'},
        </div>
        
        <p>
            Thank you for your continued training with ${company.name}. 
            Please find attached your invoice for recent flight instruction services.
        </p>
        
        <div class="invoice-summary">
            <div class="invoice-details">
                <div>
                    <div class="invoice-number">Invoice #${invoice.invoice_number}</div>
                    <div>Date: ${invoiceDate}</div>
                    <div>Due: ${dueDate}</div>
                    <div style="margin-top: 8px;">
                        <span class="status-badge status-${invoice.status}">${invoice.status}</span>
                    </div>
                </div>
                <div class="amount">$${invoice.total_amount.toFixed(2)}</div>
            </div>
            
            <div class="breakdown">
                <div class="breakdown-item">
                    <span>Flight Instruction (${invoice.flight_hours.toFixed(1)} hours)</span>
                    <span>$${invoice.flight_amount.toFixed(2)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Ground Instruction (${invoice.ground_hours.toFixed(1)} hours)</span>
                    <span>$${invoice.ground_amount.toFixed(2)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Total Amount Due</span>
                    <span>$${invoice.total_amount.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        ${invoice.status !== 'paid' ? `
        <div class="payment-info">
            <h3>Payment Information</h3>
            <p><strong>Payment Due:</strong> ${dueDate}</p>
            <p><strong>Accepted Payment Methods:</strong></p>
            <ul class="payment-methods">
                <li>Cash or Check (in person)</li>
                <li>Credit/Debit Card</li>
                <li>Account Balance (if available)</li>
                <li>Bank Transfer</li>
            </ul>
            <p style="margin-top: 15px;">
                <strong>Questions about payment?</strong> Contact us at ${company.phone} or ${company.email}
            </p>
        </div>
        
        <div style="text-align: center;">
            <a href="#" class="cta-button">Pay Online</a>
        </div>
        ` : `
        <div style="background: #d1fae5; border: 1px solid #059669; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <h3 style="color: #065f46; margin-bottom: 10px;">✓ Payment Received</h3>
            <p style="color: #065f46;">Thank you! This invoice has been paid in full.</p>
        </div>
        `}
        
        ${invoice.notes ? `
        <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <strong>Notes:</strong> ${invoice.notes}
        </div>
        ` : ''}
        
        <p>
            The complete invoice details are attached as a PDF. Please keep this for your records.
        </p>
        
        <p>
            We appreciate your business and look forward to continuing your flight training journey with us!
        </p>
        
        <div class="footer">
            <div class="contact-info">
                <strong>${company.name}</strong><br>
                ${company.address}<br>
                ${company.city}, ${company.state} ${company.zip}<br>
                Phone: ${company.phone}<br>
                Email: ${company.email}
            </div>
            
            <p style="margin-top: 15px;">
                This is an automated message. Please do not reply directly to this email.
                For questions, contact us using the information above.
            </p>
        </div>
    </div>
</body>
</html>`
}

export async function sendPaymentReminderEmail(
  invoice: InstructorInvoice,
  daysOverdue: number
): Promise<{ success: boolean; message: string }> {
  try {
    const company = getCompanyInfo()
    const dueDate = format(new Date(invoice.due_date), "MMMM d, yyyy")

    const emailOptions: EmailOptions = {
      to: invoice.student?.email || '',
      subject: `Payment Reminder: Invoice ${invoice.invoice_number} - ${daysOverdue} days overdue`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #fee2e2; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin-bottom: 10px;">Payment Reminder</h2>
            <p style="color: #dc2626;">Your payment for Invoice #${invoice.invoice_number} is ${daysOverdue} days overdue.</p>
          </div>
          
          <p>Dear ${invoice.student?.first_name || 'Student'},</p>
          
          <p>This is a friendly reminder that payment for Invoice #${invoice.invoice_number} was due on ${dueDate} and is now ${daysOverdue} days overdue.</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
            <p><strong>Amount Due:</strong> $${invoice.total_amount.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
          </div>
          
          <p>Please submit your payment as soon as possible to avoid any late fees. If you have already paid, please disregard this notice.</p>
          
          <p>If you have any questions or need to discuss payment arrangements, please contact us at ${company.phone} or ${company.email}.</p>
          
          <p>Thank you for your prompt attention to this matter.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #666;">
            <p><strong>${company.name}</strong><br>
            ${company.phone} | ${company.email}</p>
          </div>
        </div>
      `
    }

    // Simulate sending reminder email
    console.log('Payment reminder would be sent:', emailOptions)

    return {
      success: true,
      message: `Payment reminder sent to ${emailOptions.to}`
    }
  } catch (error) {
    console.error('Error sending payment reminder:', error)
    return {
      success: false,
      message: `Failed to send payment reminder: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}
