import { NextRequest, NextResponse } from 'next/server'
import { convertToStudent, getDiscoveryFlightById } from '@/lib/discovery-flight-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication and admin role
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`role:roles(name)`)
      .eq('user_id', user.id)

    const roles = userRoles?.map(ur => ur.role?.name).filter(Boolean) || []
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { discovery_flight_id, syllabus_id } = body

    if (!discovery_flight_id) {
      return NextResponse.json({ error: 'Missing discovery flight ID' }, { status: 400 })
    }

    // Get discovery flight
    const discoveryFlight = await getDiscoveryFlightById(discovery_flight_id)
    if (!discoveryFlight) {
      return NextResponse.json({ error: 'Discovery flight not found' }, { status: 404 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(discoveryFlight.email)

    let studentProfileId: string

    if (existingUser) {
      // User already has an account, get their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', existingUser.id)
        .single()

      if (!profile) {
        throw new Error('User exists but profile not found')
      }

      studentProfileId = profile.id
    } else {
      // Create new user account
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: discoveryFlight.email,
        email_confirm: true,
        user_metadata: {
          first_name: discoveryFlight.first_name,
          last_name: discoveryFlight.last_name,
          phone: discoveryFlight.phone,
        },
      })

      if (createError || !newUser.user) {
        throw new Error('Failed to create user account')
      }

      // Create profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: newUser.user.id,
          email: discoveryFlight.email,
          first_name: discoveryFlight.first_name,
          last_name: discoveryFlight.last_name,
          phone: discoveryFlight.phone,
          role: 'student',
        })
        .select()
        .single()

      if (profileError || !newProfile) {
        throw new Error('Failed to create profile')
      }

      studentProfileId = newProfile.id

      // Assign student role
      const { data: studentRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'student')
        .single()

      if (studentRole) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role_id: studentRole.id,
          })
      }

      // Create student onboarding record (mark as completed since they did discovery flight onboarding)
      await supabase
        .from('student_onboarding')
        .insert({
          user_id: newUser.user.id,
          first_name: discoveryFlight.first_name,
          last_name: discoveryFlight.last_name,
          email: discoveryFlight.email,
          phone: discoveryFlight.phone,
          liability_waiver_signed: discoveryFlight.waiver_signed,
          liability_waiver_signed_at: discoveryFlight.waiver_signed_at,
          liability_waiver_signature_data: discoveryFlight.waiver_signature_data,
          current_step: 'completion',
          completed_at: new Date().toISOString(),
          onboarding_status: 'completed',
        })
    }

    // Create enrollment if instructor is assigned
    if (discoveryFlight.scheduled_instructor_id && syllabus_id) {
      await supabase
        .from('student_enrollments')
        .insert({
          student_id: studentProfileId,
          instructor_id: discoveryFlight.scheduled_instructor_id,
          syllabus_id,
          status: 'active',
          notes: `Converted from discovery flight on ${new Date().toISOString()}`,
        })
    }

    // Update discovery flight
    const updatedFlight = await convertToStudent(discovery_flight_id, studentProfileId, syllabus_id)

    return NextResponse.json({ 
      discovery_flight: updatedFlight,
      student_profile_id: studentProfileId,
    }, { status: 200 })
  } catch (error) {
    console.error('Error converting to student:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


