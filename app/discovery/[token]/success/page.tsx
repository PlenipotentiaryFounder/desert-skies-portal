import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Plane, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'

interface PageProps {
  params: {
    token: string
  }
  searchParams: {
    session_id?: string
  }
}

export default async function DiscoveryFlightSuccessPage({ params, searchParams }: PageProps) {
  const { token } = params
  const { session_id } = searchParams

  // Decode token to get email
  let email: string
  try {
    email = Buffer.from(token, 'base64').toString('utf-8')
  } catch (error) {
    redirect('/discovery/invalid')
  }

  const supabase = await createClient()

  // Get discovery flight
  const { data: discoveryFlight } = await supabase
    .from('discovery_flights')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!discoveryFlight) {
    redirect('/discovery/invalid')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-aviation-sky-50 via-white to-aviation-sunset-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-4xl mb-2">Welcome Aboard, {discoveryFlight.first_name}!</CardTitle>
            <CardDescription className="text-lg">
              Your discovery flight is confirmed. Get ready for an unforgettable experience!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Confirmation Details */}
              <div className="bg-aviation-sky-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">What Happens Next?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-aviation-sky-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Check Your Email</h4>
                      <p className="text-sm text-gray-600">
                        We've sent a confirmation to <strong>{discoveryFlight.email}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 text-aviation-sky-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">We'll Contact You Soon</h4>
                      <p className="text-sm text-gray-600">
                        Our team will reach out within 24 hours to schedule your flight
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Plane className="w-4 h-4 text-aviation-sky-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Prepare for Your Flight</h4>
                      <p className="text-sm text-gray-600">
                        Wear comfortable clothes and bring your excitement!
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* What to Expect */}
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Your Discovery Flight Experience</h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><strong>Pre-flight briefing:</strong> Meet your instructor and learn about the aircraft</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><strong>30 minutes of flight time:</strong> You'll actually fly the plane!</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><strong>Hands-on experience:</strong> Take the controls and feel what it's like to be a pilot</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span><strong>Post-flight debrief:</strong> Discuss your experience and next steps</span>
                  </li>
                </ul>
              </div>

              {/* Payment Confirmation */}
              {session_id && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Payment Confirmed</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    ${(discoveryFlight.amount_paid_cents / 100).toFixed(2)} paid via {discoveryFlight.payment_method}
                  </p>
                </div>
              )}

              {/* Contact Information */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Questions? Contact us at{' '}
                  <a href="mailto:thomas@desertskiesaviationaz.com" className="text-aviation-sky-600 hover:underline">
                    thomas@desertskiesaviationaz.com
                  </a>
                  {' '}or{' '}
                  <a href="tel:+1234567890" className="text-aviation-sky-600 hover:underline">
                    (123) 456-7890
                  </a>
                </p>

                <Link href="https://desertskiesaviationaz.com">
                  <Button variant="outline">
                    Visit Our Website
                  </Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="text-center pt-4 border-t">
                <p className="text-xs text-gray-500">
                  Join hundreds of students who have discovered the joy of flight with Desert Skies Aviation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


