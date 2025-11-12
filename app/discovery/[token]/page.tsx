import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DiscoveryFlightOnboarding } from '@/components/discovery/discovery-flight-onboarding'

interface PageProps {
  params: {
    token: string
  }
  searchParams: {
    source?: string
    groupon?: string
  }
}

export default async function DiscoveryFlightOnboardingPage({ params, searchParams }: PageProps) {
  const { token } = params
  const { source, groupon } = searchParams

  // Decode token to get email (simple base64 encoding for now)
  let email: string
  try {
    email = Buffer.from(token, 'base64').toString('utf-8')
  } catch (error) {
    redirect('/discovery/invalid')
  }

  const supabase = await createClient()

  // Check if discovery flight exists for this email
  const { data: existingFlight } = await supabase
    .from('discovery_flights')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // If onboarding already completed, redirect to status page
  if (existingFlight && existingFlight.onboarding_status === 'completed') {
    redirect(`/discovery/${token}/status`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aviation-sky-50 via-white to-aviation-sunset-50">
      <DiscoveryFlightOnboarding 
        email={email}
        existingFlight={existingFlight}
        bookingSource={source as any || 'website'}
        grouponCode={groupon}
      />
    </div>
  )
}


