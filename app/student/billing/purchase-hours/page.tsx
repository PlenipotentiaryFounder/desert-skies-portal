"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import {
  Plane,
  Clock,
  DollarSign,
  ArrowLeft,
  Lock,
  CheckCircle,
  Calculator,
  Smartphone
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const PRESET_FLIGHT_HOURS = [5, 10, 20, 40]
const PRESET_GROUND_HOURS = [2, 5, 10, 15]

// Payment Form Component
function PaymentForm({
  flightHours,
  groundHours,
  totalCost,
  onSuccess
}: {
  flightHours: number
  groundHours: number
  totalCost: number
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setErrorMessage(null)

    try {
      // Create Payment Intent
      const response = await fetch('/api/student/billing/purchase-hours', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flightHours,
          groundHours,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirm the payment
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/student/billing`,
        },
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
      } else {
        onSuccess()
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payment Information
          </CardTitle>
          <CardDescription>
            Complete your purchase securely with Stripe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement />
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || processing}
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Pay ${totalCost.toFixed(2)}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

export default function PurchaseHoursPage() {
  const router = useRouter()
  const [flightHours, setFlightHours] = useState<number>(10)
  const [groundHours, setGroundHours] = useState<number>(5)
  const [customFlightHours, setCustomFlightHours] = useState<string>("")
  const [customGroundHours, setCustomGroundHours] = useState<string>("")
  const [showPaymentForm, setShowPaymentForm] = useState<boolean>(false)

  // Default rates - in real app, this would come from API
  const flightRate = 75.00
  const groundRate = 75.00

  const totalCost = (flightHours * flightRate) + (groundHours * groundRate)

  const handleFlightHoursSelect = (selectedHours: number) => {
    setFlightHours(selectedHours)
    setCustomFlightHours("")
  }

  const handleGroundHoursSelect = (selectedHours: number) => {
    setGroundHours(selectedHours)
    setCustomGroundHours("")
  }

  const handleCustomFlightHoursChange = (value: string) => {
    setCustomFlightHours(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setFlightHours(numValue)
    }
  }

  const handleCustomGroundHoursChange = (value: string) => {
    setCustomGroundHours(value)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      setGroundHours(numValue)
    }
  }

  const handleProceedToPayment = () => {
    setShowPaymentForm(true)
  }

  const handlePaymentSuccess = () => {
    alert(`Successfully purchased ${flightHours} flight hours and ${groundHours} ground hours for $${totalCost.toFixed(2)}!`)
    router.push('/student/billing')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/billing">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Billing
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase Instructional Hours</h1>
          <p className="text-muted-foreground">
            Pre-purchase flight and ground instruction hours at current rates
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Flight Hours Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5" />
                Flight Instruction Hours
              </CardTitle>
              <CardDescription>
                Flight time with instructor (${flightRate.toFixed(2)}/hour)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Flight Hours */}
              <div className="grid grid-cols-2 gap-2">
                {PRESET_FLIGHT_HOURS.map((presetHours) => (
                  <Button
                    key={presetHours}
                    type="button"
                    variant={flightHours === presetHours && !customFlightHours ? "default" : "outline"}
                    onClick={() => handleFlightHoursSelect(presetHours)}
                    className="h-12"
                  >
                    {presetHours} hrs
                  </Button>
                ))}
              </div>

              <Separator />

              {/* Custom Flight Hours */}
              <div className="space-y-2">
                <Label htmlFor="custom-flight-hours">Custom Hours</Label>
                <Input
                  id="custom-flight-hours"
                  type="number"
                  placeholder="Enter hours"
                  value={customFlightHours}
                  onChange={(e) => handleCustomFlightHoursChange(e.target.value)}
                  min="0.5"
                  step="0.5"
                />
              </div>

              {/* Flight Hours Display */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Flight Hours</p>
                <p className="text-2xl font-bold text-blue-600">{flightHours} hrs</p>
                <p className="text-sm text-muted-foreground">${(flightHours * flightRate).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Ground Hours Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Ground Instruction Hours
              </CardTitle>
              <CardDescription>
                Pre-brief and post-brief time (${groundRate.toFixed(2)}/hour)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Preset Ground Hours */}
              <div className="grid grid-cols-2 gap-2">
                {PRESET_GROUND_HOURS.map((presetHours) => (
                  <Button
                    key={presetHours}
                    type="button"
                    variant={groundHours === presetHours && !customGroundHours ? "default" : "outline"}
                    onClick={() => handleGroundHoursSelect(presetHours)}
                    className="h-12"
                  >
                    {presetHours} hrs
                  </Button>
                ))}
              </div>

              <Separator />

              {/* Custom Ground Hours */}
              <div className="space-y-2">
                <Label htmlFor="custom-ground-hours">Custom Hours</Label>
                <Input
                  id="custom-ground-hours"
                  type="number"
                  placeholder="Enter hours"
                  value={customGroundHours}
                  onChange={(e) => handleCustomGroundHoursChange(e.target.value)}
                  min="0.5"
                  step="0.5"
                />
              </div>

              {/* Ground Hours Display */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Ground Hours</p>
                <p className="text-2xl font-bold text-green-600">{groundHours} hrs</p>
                <p className="text-sm text-muted-foreground">${(groundHours * groundRate).toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Total Cost Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Purchase Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Flight Hours</p>
                  <p className="text-lg font-semibold">{flightHours} × ${flightRate.toFixed(2)}</p>
                  <p className="text-lg font-bold">${(flightHours * flightRate).toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Ground Hours</p>
                  <p className="text-lg font-semibold">{groundHours} × ${groundRate.toFixed(2)}</p>
                  <p className="text-lg font-bold">${(groundHours * groundRate).toFixed(2)}</p>
                </div>
                <div className="text-center p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold text-primary">${totalCost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proceed to Payment */}
        {!showPaymentForm ? (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={flightHours < 0.5 || groundHours < 0.5}
                onClick={handleProceedToPayment}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Proceed to Payment - ${totalCost.toFixed(2)}
              </Button>
            </div>
          </>
        ) : (
          <Elements
            stripe={stripePromise}
            options={{
              appearance: {
                theme: 'stripe',
              },
              paymentMethodOrder: ['apple_pay', 'google_pay', 'card'],
            }}
          >
            <PaymentForm
              flightHours={flightHours}
              groundHours={groundHours}
              totalCost={totalCost}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        )}
      </form>

      {/* Info */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Purchase Information</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Hours are immediately available after payment confirmation</li>
            <li>• Current rates: ${flightRate.toFixed(2)}/hr flight, ${groundRate.toFixed(2)}/hr ground</li>
            <li>• Hours are used automatically during flight sessions</li>
            <li>• Unused hours do not expire</li>
            <li>• You'll receive an email confirmation once the payment is complete</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
