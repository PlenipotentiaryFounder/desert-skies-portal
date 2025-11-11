import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InstructorInviteForm } from '@/components/admin/instructor-invite-form'

export default async function AdminInstructorInvitePage() {
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

  // Check if user has admin role
  if (!roles.includes('admin')) {
    redirect('/login')
  }

  // Get existing invitations
  const { data: invitations } = await supabase
    .from('instructor_invitation_tokens')
    .select('*')
    .order('invited_at', { ascending: false })
    .limit(50)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invite New Instructor</h1>
          <p className="text-gray-600 mt-2">
            Send an invitation link to a new instructor to join your team. They'll be able to create their account and complete onboarding.
          </p>
        </div>

        <InstructorInviteForm existingInvitations={invitations || []} />
      </div>
    </div>
  )
}

