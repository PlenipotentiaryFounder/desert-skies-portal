'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DollarSign, AlertTriangle, ExternalLink, RefreshCw, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StripeConnectBannerProps {
  stripeConnectAccountId: string | null
  stripeConnectOnboardingComplete: boolean
  userProfile: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
}

export function StripeConnectBanner({
  stripeConnectAccountId,
  stripeConnectOnboardingComplete,
  userProfile
}: StripeConnectBannerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const router = useRouter()

  // Don't show if already complete or dismissed
  if (stripeConnectOnboardingComplete || isDismissed) {
    return null
  }

  const handleConnectStripe = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/instructor/stripe-connect/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instructorId: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Stripe Connect account')
      }

      if (data.onboarding_url) {
        // Redirect to Stripe onboarding
        window.location.href = data.onboarding_url
      } else {
        throw new Error('No onboarding URL returned')
      }

    } catch (err: any) {
      console.error('Error initiating Stripe Connect:', err)
      setError(err.message || 'Failed to initiate Stripe Connect')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Complete Your Payment Setup
                </h3>
                <p className="text-sm text-gray-700 mt-1">
                  Connect your bank account to start receiving payments for your instruction
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDismissed(true)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="bg-white/50 border-orange-200">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-gray-700">
                <strong>Important:</strong> You cannot receive payouts until you complete Stripe Connect setup.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleConnectStripe}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect with Stripe
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-600">
                Takes about 5 minutes • Secure & encrypted
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

