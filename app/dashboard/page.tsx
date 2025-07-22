import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user roles
  const { data: userRoles, error: rolesError } = await supabase.rpc('get_user_roles_for_middleware', { 
    p_user_id: user.id 
  })

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError)
    // Default to student dashboard if there's an error
    redirect("/student/dashboard")
  }

  const roles = userRoles as { role_name: string }[] || []
  const hasAdmin = roles.some(r => r.role_name === 'admin')
  const hasInstructor = roles.some(r => r.role_name === 'instructor')
  const hasStudent = roles.some(r => r.role_name === 'student')

  // Priority: instructor > admin > student
  if (hasInstructor) {
    redirect("/instructor/dashboard")
  } else if (hasAdmin) {
    redirect("/admin/dashboard")
  } else if (hasStudent) {
    // Check if student has completed onboarding
    try {
      const { data: onboardingData } = await supabase
        .from('student_onboarding')
        .select('completed_at')
        .eq('user_id', user.id)
        .single()

      if (!onboardingData?.completed_at) {
        // Student hasn't completed onboarding
        redirect("/student/onboarding")
      } else {
        // Student has completed onboarding
        redirect("/student/dashboard")
      }
    } catch (onboardingError) {
      console.error("Error checking onboarding status:", onboardingError)
      // If there's an error, default to onboarding to be safe
      redirect("/student/onboarding")
    }
  } else {
    // No roles found, redirect to login
    redirect("/login")
  }
} 