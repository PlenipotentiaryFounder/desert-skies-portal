import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingFlow } from '@/components/student/onboarding/onboarding-flow'

export default async function StudentOnboardingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Get current onboarding status
  const { data: onboarding } = await supabase
    .from('student_onboarding')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // If no onboarding record exists, create one
  if (!onboarding) {
    await supabase
      .from('student_onboarding')
      .insert({
        user_id: user.id,
        current_step: 'welcome',
        step_number: 1
      })
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user roles
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      role:roles(name)
    `)
    .eq('user_id', user.id)

  const roles = userRoles?.map(ur => ur.role?.name).filter(Boolean) || []

  // Check if user has student role
  if (!roles.includes('student')) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8">
      <OnboardingFlow 
        user={user} 
        profile={profile} 
        initialOnboarding={onboarding}
      />
    </div>
  )
}