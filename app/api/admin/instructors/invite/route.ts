import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email-service'
import { renderToStaticMarkup } from 'react-dom/server'
import InstructorInvitationEmail from '@/app/emails/InstructorInvitationEmail'
import crypto from 'crypto'

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
      const emailHtml = renderToStaticMarkup(
        InstructorInvitationEmail({
          instructorName: `${firstName} ${lastName}`,
          inviteUrl,
          expiresAt: expiresAt.toISOString(),
          invitedBy: user.email || 'Desert Skies Aviation'
        })
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

