import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email-service'
import crypto from 'crypto'

// HTML email template
function createInvitationEmailHtml(
  instructorName: string,
  inviteUrl: string,
  expiresAt: string,
  invitedBy: string
): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Join Desert Skies Aviation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Desert Skies Aviation</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Flight Instructor Invitation</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1e293b; margin-top: 0;">Welcome, ${instructorName}!</h2>
          
          <p style="font-size: 16px; color: #475569;">
            You've been invited by ${invitedBy} to join Desert Skies Aviation as a certified flight instructor. 
            We're excited to have you join our team of dedicated aviation professionals.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="color: #1e293b; margin-top: 0; font-size: 18px;">What's Next?</h3>
            <ol style="color: #475569; padding-left: 20px;">
              <li style="margin-bottom: 10px;">Click the button below to accept your invitation</li>
              <li style="margin-bottom: 10px;">Create your secure account password</li>
              <li style="margin-bottom: 10px;">Complete the onboarding process (takes 3-5 minutes)</li>
              <li style="margin-bottom: 10px;">Start teaching and inspiring future pilots!</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              Accept Invitation & Get Started
            </a>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏰ This invitation expires on ${expiryDate}</strong><br>
              Please complete your onboarding before this date.
            </p>
          </div>
          
          <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <h3 style="color: #1e293b; font-size: 16px; margin-bottom: 15px;">What You'll Need:</h3>
            <ul style="color: #475569; font-size: 14px;">
              <li>CFI Certificate & other aviation credentials</li>
              <li>Government-issued ID</li>
              <li>Medical Certificate</li>
              <li>Proof of insurance</li>
              <li>Banking information for direct deposit</li>
            </ul>
          </div>
          
          <p style="font-size: 14px; color: #64748b; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            If you have any questions or didn't request this invitation, please contact us immediately.
          </p>
          
          <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
            <strong>Desert Skies Aviation</strong><br>
            Building the next generation of safe, skilled pilots
          </p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role:roles(name)
      `)
      .eq('user_id', user.id)
    
    const roles = userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || []
    
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }
    
    // Parse request body
    const body = await request.json()
    const { email, firstName, lastName, roles: assignedRoles = ['instructor'], permissions = {} } = body
    
    if (!email || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, firstName, lastName' 
      }, { status: 400 })
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }
    
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single()
    
    if (existingProfile) {
      return NextResponse.json({ 
        error: 'User with this email already exists' 
      }, { status: 409 })
    }
    
    // Check for existing unused invitation
    const { data: existingInvite } = await supabase
      .from('instructor_invitation_tokens')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (existingInvite) {
      // Return existing invitation
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/instructor/onboarding/accept?token=${existingInvite.token}`
      
      return NextResponse.json({ 
        success: true,
        invitation: {
          id: existingInvite.id,
          email: existingInvite.email,
          token: existingInvite.token,
          inviteUrl,
          expiresAt: existingInvite.expires_at
        },
        message: 'An active invitation already exists for this email'
      })
    }
    
    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Set expiration (7 days from now)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    
    // Create invitation token
    const { data: invitation, error: inviteError } = await supabase
      .from('instructor_invitation_tokens')
      .insert({
        token,
        email,
        invited_by: user.id,
        expires_at: expiresAt.toISOString(),
        roles: assignedRoles,
        permissions,
        metadata: {
          first_name: firstName,
          last_name: lastName,
          invited_by_email: user.email
        }
      })
      .select()
      .single()
    
    if (inviteError) {
      console.error('Error creating invitation:', inviteError)
      return NextResponse.json({ 
        error: 'Failed to create invitation: ' + inviteError.message 
      }, { status: 500 })
    }
    
    // Generate invitation URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/instructor/onboarding/accept?token=${token}`
    
    // Send invitation email
    try {
      const emailHtml = createInvitationEmailHtml(
        `${firstName} ${lastName}`,
        inviteUrl,
        expiresAt.toISOString(),
        user.email || 'Desert Skies Aviation'
      )
      
      await sendEmail({
        to: email,
        subject: 'Invitation to Join Desert Skies Aviation as an Instructor',
        html: emailHtml
      })
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the request if email fails, invitation is still created
    }
    
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        inviteUrl,
        expiresAt: invitation.expires_at,
        roles: invitation.roles
      }
    })
    
  } catch (error: any) {
    console.error('Error in instructor invitation:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}

// GET endpoint to list all invitations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify admin authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Verify admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role:roles(name)
      `)
      .eq('user_id', user.id)
    
    const roles = userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || []
    
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const showUsed = searchParams.get('showUsed') === 'true'
    const showExpired = searchParams.get('showExpired') === 'true'
    
    // Build query
    let query = supabase
      .from('instructor_invitation_tokens')
      .select('*')
      .order('invited_at', { ascending: false })
    
    if (!showUsed) {
      query = query.eq('used', false)
    }
    
    if (!showExpired) {
      query = query.gt('expires_at', new Date().toISOString())
    }
    
    const { data: invitations, error } = await query
    
    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch invitations: ' + error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      invitations
    })
    
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}

