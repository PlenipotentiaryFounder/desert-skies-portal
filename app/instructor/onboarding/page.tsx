import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/instructor/onboarding/onboarding-flow'

export default async function InstructorOnboardingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      role:roles(name)
    `)
    .eq('user_id', user.id)

  const roles = userRoles?.map(ur => ur.role?.name).filter(Boolean) || []

  // Check if user has instructor role
  if (!roles.includes('instructor')) {
    console.log('User does not have instructor role, redirecting to login')
    redirect('/login')
  }

  // Get current onboarding status
  const { data: onboarding, error: onboardingError } = await supabase
    .from('instructor_onboarding')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If no onboarding record exists, create one
  if (onboardingError && onboardingError.code === 'PGRST116') {
    console.log('No onboarding record found, creating one for instructor:', user.id)
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: newOnboarding, error: createError } = await supabase
      .from('instructor_onboarding')
      .insert({
        user_id: user.id,
        current_step: 'welcome',
        step_number: 1,
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating onboarding record:', createError)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-600">
              Failed to initialize onboarding. Please contact support.
            </p>
            <p className="text-sm text-gray-500 mt-2">{createError.message}</p>
          </div>
        </div>
      )
    }

    // Use the newly created onboarding record
    return (
      <OnboardingFlow 
        userId={user.id} 
        userProfile={profile} 
        initialOnboarding={newOnboarding}
      />
    )
  }

  // If onboarding is complete, redirect to dashboard
  if (onboarding?.completed_at) {
    console.log('Instructor onboarding already complete, redirecting to dashboard')
    redirect('/instructor/dashboard')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <OnboardingFlow 
      userId={user.id} 
      userProfile={profile} 
      initialOnboarding={onboarding}
    />
  )
}

