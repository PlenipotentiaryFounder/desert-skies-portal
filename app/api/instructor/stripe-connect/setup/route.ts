import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createInstructorConnectAccount } from '@/lib/stripe-connect-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body
    const body = await request.json()
    const { instructorId, email, firstName, lastName } = body
    
    if (!instructorId || !email || !firstName || !lastName) {
      return NextResponse.json({ 
        error: 'Missing required fields: instructorId, email, firstName, lastName' 
      }, { status: 400 })
    }
    
    // Verify user is accessing their own account
    if (instructorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check if Stripe Connect account already exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_connect_account_id, stripe_connect_onboarding_complete')
      .eq('id', instructorId)
      .single()
    
    if (profile?.stripe_connect_account_id && profile?.stripe_connect_onboarding_complete) {
      return NextResponse.json({
        success: true,
        message: 'Stripe Connect account already set up',
        account_id: profile.stripe_connect_account_id,
        onboarding_complete: true
      })
    }
    
    // Create Stripe Connect account
    const result = await createInstructorConnectAccount(
      instructorId,
      email,
      firstName,
      lastName
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create Stripe Connect account')
    }
    
    return NextResponse.json({
      success: true,
      account_id: result.account_id,
      onboarding_url: result.onboarding_url
    })
    
  } catch (error: any) {
    console.error('Error in Stripe Connect setup:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error.message || 'Unknown error')
    }, { status: 500 })
  }
}

