'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DollarSign, AlertTriangle, Check, RefreshCw, ExternalLink, CheckCircle } from 'lucide-react'

interface StripeConnectStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

export function StripeConnectStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: StripeConnectStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(
    onboardingData.stripe_connect_account_id || userProfile.stripe_connect_account_id || null
  )
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(
    onboardingData.stripe_connect_completed || userProfile.stripe_connect_onboarding_complete || false
  )

  const initiateStripeConnect = async () => {
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
          firstName: userProfile.first_name || onboardingData.first_name,
          lastName: userProfile.last_name || onboardingData.last_name
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

  const handleComplete = () => {
    const data = {
      stripe_connect_initiated: true,
      stripe_connect_completed: onboardingComplete,
      stripe_connect_account_id: stripeAccountId,
      stripe_connect_completed_step: true
    }
    onComplete(data)
  }

  // Check if returning from Stripe
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('stripe') === 'complete') {
      setOnboardingComplete(true)
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <DollarSign className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold text-gray-900">Payment Setup</h2>
        <p className="text-gray-700">
          Connect your bank account to receive direct deposits for your instruction
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert className="bg-blue-50 border-blue-200">
        <DollarSign className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Stripe Connect</strong> enables fast, secure payments directly to your bank account. 
          You'll be redirected to Stripe to complete a quick setup process.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Why Stripe Connect?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Fast Payments</p>
                <p className="text-gray-600">Get paid within 1-2 business days after completing lessons</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Secure & Compliant</p>
                <p className="text-gray-600">Bank-level security and full compliance with financial regulations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Direct Deposit</p>
                <p className="text-gray-600">Funds deposited directly into your bank account</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Tax Forms Provided</p>
                <p className="text-gray-600">Automatic 1099 forms generated at year-end</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What You'll Need</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            <li>Bank account number and routing number</li>
            <li>Social Security Number or EIN</li>
            <li>Date of birth</li>
            <li>Government-issued ID (for verification)</li>
            <li>About 5 minutes to complete the process</li>
          </ul>
        </CardContent>
      </Card>

      {onboardingComplete ? (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <p className="font-semibold text-green-900 mb-2">✅ Stripe Connect Setup Complete!</p>
            <p className="text-sm text-green-700">
              Your bank account is connected and you're ready to receive payments. You can manage your 
              payment settings from your instructor dashboard.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center gap-4 pt-6">
        {onboardingComplete ? (
          <Button
            onClick={handleComplete}
            disabled={isSaving}
            size="lg"
            className="min-w-48"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Continue to Next Step
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={onSkip}
              disabled={isSaving || isLoading}
              size="lg"
            >
              Skip for Now
            </Button>
            <Button
              onClick={initiateStripeConnect}
              disabled={isLoading}
              size="lg"
              className="min-w-48"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting to Stripe...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect with Stripe
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {!onboardingComplete && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900 text-sm">
            <strong>You can skip this step</strong> and complete it later from your dashboard. However, 
            you won't be able to receive payments until you finish connecting your bank account.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

