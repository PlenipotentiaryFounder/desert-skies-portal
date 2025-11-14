import { Resend } from 'resend'
import React from 'react'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// =====================================================
// EMAIL TEMPLATES
// =====================================================

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export function getDiscoveryFlightConfirmationEmail(data: {
  first_name: string
  last_name: string
  email: string
}): EmailTemplate {
  const subject = `Welcome to Desert Skies Aviation, ${data.first_name}!`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✈️ Welcome Aboard!</h1>
    </div>
    <div class="content">
      <h2>Hi ${data.first_name},</h2>
      <p>Thank you for booking your discovery flight with Desert Skies Aviation! We're thrilled to help you experience the joy of flight.</p>
      
      <h3>What's Next?</h3>
      <ul>
        <li><strong>Review Confirmation:</strong> Our team will review your information within 24 hours</li>
        <li><strong>Instructor Assignment:</strong> We'll match you with one of our experienced instructors</li>
        <li><strong>Schedule Your Flight:</strong> You'll receive an email to choose your preferred date and time</li>
        <li><strong>Pre-Flight Prep:</strong> We'll send you everything you need to know before your flight</li>
      </ul>

      <h3>What to Expect</h3>
      <p>Your discovery flight includes:</p>
      <ul>
        <li>Pre-flight briefing with your instructor</li>
        <li>30 minutes of actual flight time</li>
        <li>Hands-on flying experience - you'll control the aircraft!</li>
        <li>Post-flight debrief and Q&A</li>
      </ul>

      <p><strong>Questions?</strong> Reply to this email or call us at (123) 456-7890</p>

      <p>See you in the skies soon!</p>
      <p><strong>The Desert Skies Aviation Team</strong></p>
    </div>
    <div class="footer">
      <p>Desert Skies Aviation Training LLC<br>
      Phoenix, Arizona<br>
      <a href="https://desertskiesaviationaz.com">desertskiesaviationaz.com</a></p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Hi ${data.first_name},

Thank you for booking your discovery flight with Desert Skies Aviation! We're thrilled to help you experience the joy of flight.

What's Next?
- Review Confirmation: Our team will review your information within 24 hours
- Instructor Assignment: We'll match you with one of our experienced instructors
- Schedule Your Flight: You'll receive an email to choose your preferred date and time
- Pre-Flight Prep: We'll send you everything you need to know before your flight

What to Expect:
Your discovery flight includes:
- Pre-flight briefing with your instructor
- 30 minutes of actual flight time
- Hands-on flying experience - you'll control the aircraft!
- Post-flight debrief and Q&A

Questions? Reply to this email or call us at (123) 456-7890

See you in the skies soon!
The Desert Skies Aviation Team

Desert Skies Aviation Training LLC
Phoenix, Arizona
desertskiesaviationaz.com
  `

  return { subject, html, text }
}

export function getDiscoveryFlightReminderEmail(data: {
  first_name: string
  scheduled_date: string
  scheduled_time: string
  instructor_name: string
  hours_until: number
}): EmailTemplate {
  const subject = `Reminder: Your Discovery Flight is ${data.hours_until === 24 ? 'Tomorrow' : 'in 1 Hour'}!`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .highlight-box { background: #fff; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✈️ Your Flight is Coming Up!</h1>
    </div>
    <div class="content">
      <h2>Hi ${data.first_name},</h2>
      <p>This is a friendly reminder that your discovery flight is ${data.hours_until === 24 ? 'tomorrow' : 'in just 1 hour'}!</p>
      
      <div class="highlight-box">
        <h3>Flight Details</h3>
        <p><strong>Date:</strong> ${data.scheduled_date}</p>
        <p><strong>Time:</strong> ${data.scheduled_time}</p>
        <p><strong>Instructor:</strong> ${data.instructor_name}</p>
        <p><strong>Duration:</strong> Approximately 1 hour (including briefing)</p>
      </div>

      <h3>What to Bring</h3>
      <ul>
        <li>Your government-issued ID</li>
        <li>Comfortable clothing (avoid loose items)</li>
        <li>Sunglasses (recommended)</li>
        <li>Your excitement and questions!</li>
      </ul>

      <h3>Important Notes</h3>
      <ul>
        <li>Please arrive 15 minutes early for check-in</li>
        <li>Weather permitting - we'll contact you if conditions aren't safe</li>
        <li>If you need to reschedule, please call us ASAP at (123) 456-7890</li>
      </ul>

      <p>We can't wait to take you flying!</p>
      <p><strong>The Desert Skies Aviation Team</strong></p>
    </div>
    <div class="footer">
      <p>Desert Skies Aviation Training LLC<br>
      Phoenix, Arizona<br>
      <a href="https://desertskiesaviationaz.com">desertskiesaviationaz.com</a></p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Hi ${data.first_name},

This is a friendly reminder that your discovery flight is ${data.hours_until === 24 ? 'tomorrow' : 'in just 1 hour'}!

Flight Details:
- Date: ${data.scheduled_date}
- Time: ${data.scheduled_time}
- Instructor: ${data.instructor_name}
- Duration: Approximately 1 hour (including briefing)

What to Bring:
- Your government-issued ID
- Comfortable clothing (avoid loose items)
- Sunglasses (recommended)
- Your excitement and questions!

Important Notes:
- Please arrive 15 minutes early for check-in
- Weather permitting - we'll contact you if conditions aren't safe
- If you need to reschedule, please call us ASAP at (123) 456-7890

We can't wait to take you flying!
The Desert Skies Aviation Team
  `

  return { subject, html, text }
}

export function getDiscoveryFlightFollowUpEmail(data: {
  first_name: string
  instructor_name?: string
}): EmailTemplate {
  const subject = `How Was Your Discovery Flight, ${data.first_name}?`
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0ea5e9 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .highlight-box { background: #fff; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✈️ How Was Your Flight?</h1>
    </div>
    <div class="content">
      <h2>Hi ${data.first_name},</h2>
      <p>We hope you had an amazing experience on your discovery flight${data.instructor_name ? ` with ${data.instructor_name}` : ''}!</p>
      
      <p>We'd love to hear about your experience. Your feedback helps us continue to provide the best possible flight training.</p>

      <h3>Ready to Continue Your Aviation Journey?</h3>
      <p>If you caught the flying bug (most people do!), we'd love to help you earn your pilot's license.</p>

      <div class="highlight-box">
        <h3>🎓 Private Pilot Certificate Program</h3>
        <p>Transform your discovery flight into a full pilot's license!</p>
        <ul>
          <li><strong>Comprehensive Training:</strong> 40-60 hours of flight time</li>
          <li><strong>Experienced Instructors:</strong> One-on-one personalized instruction</li>
          <li><strong>Flexible Scheduling:</strong> Train at your own pace</li>
          <li><strong>Modern Aircraft:</strong> Well-maintained, GPS-equipped planes</li>
        </ul>
        <p><strong>Special Offer:</strong> Apply your discovery flight cost toward your training!</p>
      </div>

      <a href="https://desertskiesaviationaz.com/programs" class="button">Explore Training Programs</a>

      <h3>Questions?</h3>
      <p>Reply to this email or call us at (123) 456-7890. We're here to help you achieve your aviation dreams!</p>

      <p>Blue skies,</p>
      <p><strong>The Desert Skies Aviation Team</strong></p>
    </div>
    <div class="footer">
      <p>Desert Skies Aviation Training LLC<br>
      Phoenix, Arizona<br>
      <a href="https://desertskiesaviationaz.com">desertskiesaviationaz.com</a></p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
Hi ${data.first_name},

We hope you had an amazing experience on your discovery flight${data.instructor_name ? ` with ${data.instructor_name}` : ''}!

We'd love to hear about your experience. Your feedback helps us continue to provide the best possible flight training.

Ready to Continue Your Aviation Journey?
If you caught the flying bug (most people do!), we'd love to help you earn your pilot's license.

Private Pilot Certificate Program:
- Comprehensive Training: 40-60 hours of flight time
- Experienced Instructors: One-on-one personalized instruction
- Flexible Scheduling: Train at your own pace
- Modern Aircraft: Well-maintained, GPS-equipped planes

Special Offer: Apply your discovery flight cost toward your training!

Explore Training Programs: https://desertskiesaviationaz.com/programs

Questions? Reply to this email or call us at (123) 456-7890. We're here to help you achieve your aviation dreams!

Blue skies,
The Desert Skies Aviation Team
  `

  return { subject, html, text }
}

// =====================================================
// EMAIL SENDING FUNCTIONS
// =====================================================

export async function sendEmail(params: {
  to: string
  subject: string
  html?: string
  text?: string
  reactComponent?: React.ComponentType<any>
  reactProps?: any
  from?: string
  reply_to?: string
}): Promise<{ success: boolean; message_id?: string; error?: string }> {
  // If React component provided, render it to HTML
  let html = params.html
  let text = params.text
  
  if (params.reactComponent && !html) {
    try {
      // Dynamically import renderToStaticMarkup to avoid SSR issues
      const { renderToStaticMarkup } = await import('react-dom/server')
      html = renderToStaticMarkup(
        React.createElement(params.reactComponent, params.reactProps || {})
      )
      
      // If no text provided, create a simple text version from the component props
      if (!text && params.reactProps) {
        text = `Email from Desert Skies Aviation\n\nPlease view this email in an HTML-capable email client.`
      }
    } catch (renderError) {
      console.error('Error rendering React component to HTML:', renderError)
      return {
        success: false,
        error: 'Failed to render email template'
      }
    }
  }
  
  // Ensure we have HTML content
  if (!html) {
    return {
      success: false,
      error: 'No email content provided (html or reactComponent required)'
    }
  }
  
  // If Resend is not initialized (no API key), log and return success (dev mode)
  if (!resend) {
    console.log('[DEV MODE] Email would be sent:', {
      to: params.to,
      subject: params.subject,
      from: params.from || 'Desert Skies Aviation <noreply@desertskiesaviationaz.com>',
      hasReactComponent: !!params.reactComponent,
      htmlLength: html?.length || 0
    })
    return { success: true, message_id: 'dev-mode-no-email-sent' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: params.from || 'Desert Skies Aviation <noreply@desertskiesaviationaz.com>',
      to: params.to,
      subject: params.subject,
      html: html,
      text: text || '',
      reply_to: params.reply_to || 'thomas@desertskiesaviationaz.com',
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, message_id: data?.id }
  } catch (error) {
    console.error('Error sending email:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

export async function sendDiscoveryFlightConfirmation(data: {
  email: string
  first_name: string
  last_name: string
}): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const template = getDiscoveryFlightConfirmationEmail(data)
  return sendEmail({
    to: data.email,
    ...template,
  })
}

export async function sendDiscoveryFlightReminder(data: {
  email: string
  first_name: string
  scheduled_date: string
  scheduled_time: string
  instructor_name: string
  hours_until: number
}): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const template = getDiscoveryFlightReminderEmail(data)
  return sendEmail({
    to: data.email,
    ...template,
  })
}

export async function sendDiscoveryFlightFollowUp(data: {
  email: string
  first_name: string
  instructor_name?: string
}): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const template = getDiscoveryFlightFollowUpEmail(data)
  return sendEmail({
    to: data.email,
    ...template,
  })
}
