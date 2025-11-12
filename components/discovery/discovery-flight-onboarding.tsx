'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Check, Upload, FileText, CreditCard, Plane } from 'lucide-react'
import { DiscoveryFlight, BookingSource } from '@/lib/discovery-flight-service'

interface DiscoveryFlightOnboardingProps {
  email: string
  existingFlight?: DiscoveryFlight | null
  bookingSource: BookingSource
  grouponCode?: string
}

type OnboardingStep = 'welcome' | 'personal_info' | 'id_upload' | 'waiver' | 'payment' | 'complete'

export function DiscoveryFlightOnboarding({
  email,
  existingFlight,
  bookingSource,
  grouponCode,
}: DiscoveryFlightOnboardingProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome')
  const [discoveryFlightId, setDiscoveryFlightId] = useState<string | null>(existingFlight?.id || null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Form data
  const [firstName, setFirstName] = useState(existingFlight?.first_name || '')
  const [lastName, setLastName] = useState(existingFlight?.last_name || '')
  const [phone, setPhone] = useState(existingFlight?.phone || '')
  const [specialRequests, setSpecialRequests] = useState(existingFlight?.special_requests || '')
  
  // ID Upload
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Waiver
  const [hasRead, setHasRead] = useState(false)
  const [hasAgreed, setHasAgreed] = useState(false)
  const [signatureName, setSignatureName] = useState('')
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Payment
  const [hasGroupon, setHasGroupon] = useState(!!grouponCode)
  const [grouponCodeInput, setGrouponCodeInput] = useState(grouponCode || '')

  // Calculate progress
  const steps: OnboardingStep[] = ['welcome', 'personal_info', 'id_upload', 'waiver', 'payment', 'complete']
  const currentStepIndex = steps.indexOf(currentStep)
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Initialize canvas for signature
  useEffect(() => {
    if (currentStep === 'waiver' && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
      }
    }
  }, [currentStep])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIdFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setIdPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(x, y)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false)
      setSignatureData(canvasRef.current.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        setSignatureData(null)
      }
    }
  }

  // Step handlers
  const handleWelcome = () => {
    setCurrentStep('personal_info')
  }

  const handlePersonalInfo = async () => {
    if (!firstName || !lastName) {
      toast({
        title: 'Missing Information',
        description: 'Please enter your first and last name.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/discovery/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_or_update',
          email,
          first_name: firstName,
          last_name: lastName,
          phone,
          special_requests: specialRequests,
          booking_source: bookingSource,
          groupon_code: hasGroupon ? grouponCodeInput : undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setDiscoveryFlightId(data.discovery_flight.id)
      setCurrentStep('id_upload')
      
      toast({
        title: 'Information Saved',
        description: 'Your personal information has been saved.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save information',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleIDUpload = async () => {
    if (!idFile) {
      toast({
        title: 'Missing ID',
        description: 'Please upload a photo of your ID.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      // Upload file
      const formData = new FormData()
      formData.append('file', idFile)
      formData.append('discovery_flight_id', discoveryFlightId!)

      const response = await fetch('/api/discovery/upload-id', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setCurrentStep('waiver')
      
      toast({
        title: 'ID Uploaded',
        description: 'Your ID has been uploaded successfully.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload ID',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleWaiver = async () => {
    if (!hasRead || !hasAgreed || !signatureName || !signatureData) {
      toast({
        title: 'Incomplete Waiver',
        description: 'Please read, agree, and sign the waiver.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/discovery/sign-waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discovery_flight_id: discoveryFlightId,
          signature_name: signatureName,
          signature_data: signatureData,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setCurrentStep('payment')
      
      toast({
        title: 'Waiver Signed',
        description: 'Your liability waiver has been signed.',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign waiver',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePayment = async () => {
    setIsLoading(true)
    try {
      if (hasGroupon && grouponCodeInput) {
        // Verify Groupon code
        const response = await fetch('/api/discovery/verify-groupon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discovery_flight_id: discoveryFlightId,
            groupon_code: grouponCodeInput,
          }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

        setCurrentStep('complete')
      } else {
        // Process Stripe payment
        const response = await fetch('/api/discovery/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            discovery_flight_id: discoveryFlightId,
          }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

        // Redirect to Stripe checkout
        window.location.href = data.checkout_url
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process payment',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-gray-600 mt-2 text-center">
          Step {currentStepIndex + 1} of {steps.length}
        </p>
      </div>

      {/* Welcome Step */}
      {currentStep === 'welcome' && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-aviation-sky-100 rounded-full flex items-center justify-center">
              <Plane className="w-8 h-8 text-aviation-sky-600" />
            </div>
            <CardTitle className="text-3xl">Welcome to Desert Skies Aviation!</CardTitle>
            <CardDescription className="text-lg">
              You're about to experience the thrill of flight. Let's get you set up in just 30 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-aviation-sky-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What to expect:</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Quick personal information
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Upload your ID (driver's license or passport)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Sign liability waiver
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Payment (if not already paid)
                  </li>
                </ul>
              </div>
              <Button onClick={handleWelcome} className="w-full" size="lg">
                Let's Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Info Step */}
      {currentStep === 'personal_info' && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Tell us a bit about yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled className="bg-gray-50" />
              </div>
              <div>
                <Label htmlFor="specialRequests">Special Requests or Questions</Label>
                <Textarea
                  id="specialRequests"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Any special requests or questions for your instructor?"
                  rows={3}
                />
              </div>
              <Button onClick={handlePersonalInfo} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ID Upload Step */}
      {currentStep === 'id_upload' && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Your ID</CardTitle>
            <CardDescription>
              We need a photo of your driver's license or passport for TSA compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {idPreview ? (
                  <div className="space-y-4">
                    <img src={idPreview} alt="ID Preview" className="max-w-full h-auto mx-auto rounded" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      Change Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <Button onClick={() => fileInputRef.current?.click()}>
                        Choose File
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        or drag and drop
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500">
                Your ID information is encrypted and stored securely. We only use it for TSA compliance.
              </p>
              <Button onClick={handleIDUpload} className="w-full" disabled={isLoading || !idFile}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Waiver Step */}
      {currentStep === 'waiver' && (
        <Card>
          <CardHeader>
            <CardTitle>Liability Waiver</CardTitle>
            <CardDescription>Please read and sign our liability waiver</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50 text-sm">
                <h3 className="font-bold mb-2">Desert Skies Aviation Training LLC</h3>
                <h4 className="font-semibold mb-2">Flight Training & Discovery Flight Contract</h4>
                <p className="mb-2">
                  <strong>IMPORTANT:</strong> BY SIGNING THIS DOCUMENT, YOU WAIVE SUBSTANTIAL LEGAL RIGHTS,
                  INCLUDING THE RIGHT TO SUE. YOU ACKNOWLEDGE THAT AVIATION TRAINING IS DANGEROUS
                  AND CAN RESULT IN SERIOUS INJURY OR DEATH.
                </p>
                <p className="mb-2">
                  The participant acknowledges and voluntarily accepts that aviation activities inherently involve substantial
                  and unpredictable risks, including but not limited to: mechanical failure, structural failure, collision, fire, loss of
                  control, midair collision, pilot error, spatial disorientation, emergency landings, weather-related hazards, and
                  unforeseen emergencies. These risks can result in serious bodily injury, permanent disability, psychological
                  trauma, property damage, and death.
                </p>
                <p className="text-xs text-gray-600 mt-4">
                  [Abbreviated for display - full waiver text will be provided]
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="hasRead" checked={hasRead} onCheckedChange={(checked) => setHasRead(checked as boolean)} />
                <Label htmlFor="hasRead" className="text-sm">
                  I have read and understand the complete waiver
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="hasAgreed" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(checked as boolean)} />
                <Label htmlFor="hasAgreed" className="text-sm">
                  I agree to the terms and conditions
                </Label>
              </div>

              <div>
                <Label htmlFor="signatureName">Full Legal Name *</Label>
                <Input
                  id="signatureName"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label>Electronic Signature *</Label>
                <div className="border-2 border-gray-300 rounded-lg bg-white">
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={200}
                    className="w-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={clearSignature} className="mt-2">
                  Clear Signature
                </Button>
              </div>

              <Button onClick={handleWaiver} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Sign and Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Step */}
      {currentStep === 'payment' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>Complete your discovery flight booking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasGroupon" 
                  checked={hasGroupon} 
                  onCheckedChange={(checked) => setHasGroupon(checked as boolean)} 
                />
                <Label htmlFor="hasGroupon">
                  I have a Groupon code
                </Label>
              </div>

              {hasGroupon ? (
                <div>
                  <Label htmlFor="grouponCode">Groupon Code</Label>
                  <Input
                    id="grouponCode"
                    value={grouponCodeInput}
                    onChange={(e) => setGrouponCodeInput(e.target.value)}
                    placeholder="Enter your Groupon code"
                  />
                </div>
              ) : (
                <div className="bg-aviation-sky-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Discovery Flight</span>
                    <span className="text-2xl font-bold">$199</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Includes 30 minutes of flight time with a certified instructor
                  </p>
                </div>
              )}

              <Button onClick={handlePayment} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                {hasGroupon ? 'Verify Groupon Code' : 'Proceed to Payment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {currentStep === 'complete' && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-3xl">All Set!</CardTitle>
            <CardDescription className="text-lg">
              Your discovery flight is ready to be scheduled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">What's Next?</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    We'll review your information
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    An instructor will be assigned
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    You'll receive an email to schedule your flight
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    Get ready for an amazing experience!
                  </li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Check your email for confirmation and next steps.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


