import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DiscoveryFlightsDashboard } from '@/components/admin/discovery-flights-dashboard'
import { getDiscoveryFlightsDashboard, getDiscoveryFlightStats } from '@/lib/discovery-flight-service'

export default async function AdminDiscoveryFlightsPage() {
  const supabase = await createClient()

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Check if user is admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      role:roles(name)
    `)
    .eq('user_id', user.id)

  const roles = userRoles?.map(ur => ur.role?.name).filter(Boolean) || []
  if (!roles.includes('admin')) {
    redirect('/login')
  }

  // Get all instructors for assignment
  const { data: instructors } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      email,
      user_roles!inner(
        role:roles!inner(name)
      )
    `)
    .eq('user_roles.role.name', 'instructor')

  // Get all aircraft
  const { data: aircraft } = await supabase
    .from('aircraft')
    .select('*')
    .eq('status', 'active')

  // Get discovery flights
  const discoveryFlights = await getDiscoveryFlightsDashboard()
  const stats = await getDiscoveryFlightStats()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Discovery Flights</h1>
        <p className="text-gray-600 mt-2">
          Manage discovery flight bookings and convert customers to students
        </p>
      </div>

      <DiscoveryFlightsDashboard
        discoveryFlights={discoveryFlights}
        stats={stats}
        instructors={instructors || []}
        aircraft={aircraft || []}
      />
    </div>
  )
}


