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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Desert Skies Aviation Training!
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let's get you set up for your aviation journey. You can complete this process 
              at your own pace and return anytime to continue where you left off.
            </p>
          </div>
          
          <OnboardingFlow 
            initialOnboarding={onboarding}
            userProfile={profile}
            userId={user.id}
          />
        </div>
      </div>
    </div>
  )
} 