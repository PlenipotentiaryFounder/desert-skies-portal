import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Parse request body
    const body = await request.json()
    const { token, password, firstName, lastName } = body
    
    if (!token || !password || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields: token, password, firstName, lastName' 
      }, { status: 400 })
    }
    
    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({ 
        error: 'Password must be at least 8 characters long' 
      }, { status: 400 })
    }
    
    // Verify invitation token
    const { data: invitation, error: inviteError } = await supabase
      .from('instructor_invitation_tokens')
      .select('*')
      .eq('token', token)
      .single()
    
    if (inviteError || !invitation) {
      return NextResponse.json({ 
        error: 'Invalid invitation token' 
      }, { status: 404 })
    }
    
    // Check if token is already used
    if (invitation.used) {
      return NextResponse.json({ 
        error: 'This invitation has already been used' 
      }, { status: 409 })
    }
    
    // Check if token is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'This invitation has expired' 
      }, { status: 410 })
    }
    
    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', invitation.email)
      .single()
    
    if (existingProfile) {
      return NextResponse.json({ 
        error: 'An account with this email already exists' 
      }, { status: 409 })
    }
    
    // Create auth user using admin API
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true, // Auto-confirm email for invited users
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        invited: true,
        invitation_id: invitation.id
      }
    })
    
    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json({ 
        error: 'Failed to create account: ' + (authError?.message || 'Unknown error')
      }, { status: 500 })
    }
    
    const userId = authData.user.id
    
    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: invitation.email,
        first_name: firstName,
        last_name: lastName,
        status: 'active'
      })
    
    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(userId)
      return NextResponse.json({ 
        error: 'Failed to create profile: ' + profileError.message 
      }, { status: 500 })
    }
    
    // Assign roles from invitation
    const roles = invitation.roles || ['instructor']
    
    for (const roleName of roles) {
      // Get role ID
      const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single()
      
      if (role) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role_id: role.id
          })
        
        if (roleError) {
          console.error(`Error assigning role ${roleName}:`, roleError)
        }
      }
    }
    
    // Create instructor onboarding record
    const { error: onboardingError } = await supabase
      .from('instructor_onboarding')
      .insert({
        user_id: userId,
        current_step: 'welcome',
        step_number: 1,
        first_name: firstName,
        last_name: lastName,
        last_activity_at: new Date().toISOString()
      })
    
    if (onboardingError) {
      console.error('Error creating onboarding record:', onboardingError)
      // Don't fail the request, onboarding can be created later
    }
    
    // Mark invitation as used
    const { error: updateError } = await supabase
      .from('instructor_invitation_tokens')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_by: userId
      })
      .eq('id', invitation.id)
    
    if (updateError) {
      console.error('Error updating invitation token:', updateError)
      // Don't fail the request
    }
    
    // Sign in the user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password: password
    })
    
    if (signInError) {
      console.error('Error signing in user:', signInError)
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please sign in.',
        userId,
        needsSignIn: true
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      userId,
      session: signInData.session,
      redirectTo: '/instructor/onboarding'
    })
    
  } catch (error: any) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}

// GET endpoint to verify token
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ 
        error: 'Missing token parameter' 
      }, { status: 400 })
    }
    
    // Verify invitation token
    const { data: invitation, error: inviteError } = await supabase
      .from('instructor_invitation_tokens')
      .select('id, email, invited_at, expires_at, used, roles, metadata')
      .eq('token', token)
      .single()
    
    if (inviteError || !invitation) {
      return NextResponse.json({ 
        valid: false,
        error: 'Invalid invitation token' 
      }, { status: 404 })
    }
    
    // Check if token is already used
    if (invitation.used) {
      return NextResponse.json({ 
        valid: false,
        error: 'This invitation has already been used' 
      }, { status: 409 })
    }
    
    // Check if token is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ 
        valid: false,
        error: 'This invitation has expired' 
      }, { status: 410 })
    }
    
    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        roles: invitation.roles,
        expiresAt: invitation.expires_at,
        metadata: invitation.metadata
      }
    })
    
  } catch (error: any) {
    console.error('Error verifying invitation:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}

