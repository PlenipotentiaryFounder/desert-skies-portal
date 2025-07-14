'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  PenTool, 
  RefreshCw, 
  Check,
  AlertTriangle,
  FileText,
  Calendar,
  MapPin
} from 'lucide-react'
import { format } from 'date-fns'

interface LiabilityWaiverStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  onSave: (data: any) => void
  isSaving: boolean
}

export function LiabilityWaiverStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  onSave,
  isSaving
}: LiabilityWaiverStepProps) {
  const [signatureName, setSignatureName] = useState(
    onboardingData.liability_waiver_signature_data?.name || 
    userProfile?.full_name || ''
  )
  const [hasRead, setHasRead] = useState(false)
  const [hasAgreed, setHasAgreed] = useState(false)
  const [signatureData, setSignatureData] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSignaturePadReady, setIsSignaturePadReady] = useState(false)

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        setIsSignaturePadReady(true)
      }
    }
  }, [])

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
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (canvas) {
      setSignatureData(canvas.toDataURL())
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

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!signatureName.trim()) {
      newErrors.push('Full name is required')
    }
    
    if (!hasRead) {
      newErrors.push('You must read the complete waiver')
    }
    
    if (!hasAgreed) {
      newErrors.push('You must agree to the waiver terms')
    }
    
    if (!signatureData) {
      newErrors.push('Electronic signature is required')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    const waiverData = {
      liability_waiver_signed: true,
      liability_waiver_signed_at: new Date().toISOString(),
      liability_waiver_signature_data: {
        name: signatureName,
        signature: signatureData,
        timestamp: new Date().toISOString(),
        ip_address: 'client-side' // Will be captured server-side
      }
    }
    
    onComplete(waiverData)
  }

  const WAIVER_CONTENT = `
Desert Skies Aviation Training LLC
Flight Training & Discovery Flight Contract

IMPORTANT: BY SIGNING THIS DOCUMENT, YOU WAIVE SUBSTANTIAL LEGAL RIGHTS,
INCLUDING THE RIGHT TO SUE. YOU ACKNOWLEDGE THAT AVIATION TRAINING IS DANGEROUS
AND CAN RESULT IN SERIOUS INJURY OR DEATH. YOU ALSO ACKNOWLEDGE THAT DESERT
SKIES AVIATION TRAINING LLC DOES NOT EXTEND INSURANCE COVERAGE TO YOU AND THAT
YOU ARE RESPONSIBLE FOR YOUR OWN INSURANCE.

CONTRACT BINDING EFFECT
This Agreement is a legally binding contract entered into between the undersigned participant and Desert
Skies Aviation Training LLC. Its purpose is to release Desert Skies Aviation Training LLC and all affiliated
Certified Flight Instructors (CFIs), whether in their individual or professional capacities, from liability and to
allocate all risks and responsibilities to the participant. This Agreement shall remain in full force and effect
before, during, and after any participation in aviation activities and shall survive the completion or termination
of training.

INSURANCE DISCLAIMER
Desert Skies Aviation Training LLC may, but is not required to, maintain insurance for its own business
operations. Any insurance maintained by the company is for the sole benefit of Desert Skies Aviation Training
LLC and does not provide any coverage to the participant, student, or any third party. The participant
expressly understands and agrees that they are solely responsible for obtaining any desired renter's
insurance, personal liability insurance, or accident coverage.

ASSUMPTION OF RISK AND ACKNOWLEDGMENT OF DANGER
The participant acknowledges and voluntarily accepts that aviation activities inherently involve substantial
and unpredictable risks, including but not limited to: mechanical failure, structural failure, collision, fire, loss of
control, midair collision, pilot error, spatial disorientation, emergency landings, weather-related hazards, and
unforeseen emergencies. These risks can result in serious bodily injury, permanent disability, psychological
trauma, property damage, and death. The participant knowingly assumes full responsibility for all such risks,
regardless of their origin.

SCOPE OF AGREEMENT
This Agreement applies broadly to all activities conducted, supervised, or arranged by Desert Skies Aviation
Training LLC, including but not limited to: ground instruction, aircraft rental, simulator sessions, solo flight
operations, dual instruction, preflight/postflight operations, transportation, discovery flights, and any time
spent at affiliated airports or facilities.

INSTRUCTOR AUTHORITY
The participant agrees that all Desert Skies Aviation Training LLC CFIs have absolute discretion and
authority over all training and flight operations. CFIs may suspend, delay, or terminate any activity for safety,
regulatory, instructional, or behavioral reasons. The participant agrees to follow all instructions, safety rules,
and regulatory guidelines issued by any CFI or authorized representative of Desert Skies Aviation Training
LLC.

FAA COMPLIANCE AND ENDORSEMENTS
The participant agrees to adhere to all applicable Federal Aviation Regulations (FARs), including but not
limited to Parts 61, 91, and 141, and understands that flight training is governed by federal law. Any
endorsements, such as for solo flight, must be issued only by a CFI affiliated with Desert Skies Aviation
Training LLC based on instruction directly provided by that instructor.

FITNESS TO TRAIN
The participant certifies that they are in good physical and mental condition to safely engage in aviation
training and will promptly disclose any illness, injury, medication, or condition (physical or psychological) that
may impair their performance or judgment.

PROHIBITED CONDUCT
The participant agrees not to use, possess, or be under the influence of alcohol, controlled substances, or
any illegal drugs while participating in any activity with Desert Skies Aviation Training LLC. The possession or
transport of firearms, explosives, or contraband is strictly prohibited.

CITIZENSHIP AND TSA COMPLIANCE
The participant affirms that they are either a natural-born U.S. citizen, naturalized citizen, or lawful permanent
resident eligible under 49 CFR 1552 for flight training in the United States. Participant agrees to provide all
required identification documentation and complete all TSA Alien Flight Student Program (AFSP) steps prior
to beginning instruction, if applicable.

RELEASE OF LIABILITY AND WAIVER OF LAWSUIT
To the fullest extent permitted by law, the participant hereby waives, releases, and discharges any and all
claims, demands, causes of action, or liabilities against Desert Skies Aviation Training LLC, its owners,
officers, directors, employees, agents, contractors, and Certified Flight Instructors (CFIs), whether in their
personal or professional capacities, arising from or related to the participant's involvement in aviation
activities, including claims based on negligence.

HOLD HARMLESS AND INDEMNIFICATION
The participant agrees to fully defend, indemnify, and hold harmless Desert Skies Aviation Training LLC and
its CFIs from and against any and all third-party claims, lawsuits, losses, liabilities, damages, or legal
expenses arising out of or relating to the participant's conduct.

NO GUARANTEE OF OUTCOME
The participant acknowledges that participation in training does not guarantee any outcome, including but not
limited to: successful solo, recommendation for checkride, or issuance of any certificate or rating.

EMERGENCY AUTHORIZATION AND DISCLAIMER OF DUTY
The participant authorizes Desert Skies Aviation Training LLC and its staff to seek emergency medical
services or transportation if deemed necessary. The participant agrees to bear all related costs.

DISPUTE RESOLUTION AND GOVERNING LAW
This Agreement shall be governed by the laws of the State of Arizona. Any dispute arising out of or related to
this Agreement shall be resolved through binding arbitration administered in Maricopa County, Arizona.

ENTIRE AGREEMENT AND SEVERABILITY
This document constitutes the full and complete understanding between the parties. If any provision is found
invalid or unenforceable, the remainder shall remain in full effect.
  `

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Shield className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Liability Waiver</h2>
        <p className="text-gray-600">
          Please read the complete waiver carefully and provide your electronic signature
        </p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Waiver Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Liability Waiver Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 w-full border rounded-lg p-4">
              <div className="whitespace-pre-wrap text-sm font-mono">
                {WAIVER_CONTENT}
              </div>
            </ScrollArea>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasRead"
                  checked={hasRead}
                  onCheckedChange={setHasRead}
                />
                <Label htmlFor="hasRead" className="text-sm">
                  I have read and understand the complete waiver above
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasAgreed"
                  checked={hasAgreed}
                  onCheckedChange={setHasAgreed}
                />
                <Label htmlFor="hasAgreed" className="text-sm font-medium">
                  I voluntarily agree to all terms and conditions in this waiver
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Electronic Signature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="signatureName">Full Legal Name</Label>
              <Input
                id="signatureName"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter your full legal name"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Draw Your Signature</Label>
              <div className="mt-2 border-2 border-gray-300 rounded-lg">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="w-full h-32 cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex justify-between mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSignature}
                  disabled={!signatureData}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Signature
                </Button>
                {signatureData && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Signature Captured
                  </Badge>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Date: {format(new Date(), 'PPP')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Location: Electronic Signature</span>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                By providing your electronic signature, you acknowledge that this has the same legal 
                effect as a handwritten signature and that you have read and agreed to all terms.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={isSaving || !hasRead || !hasAgreed || !signatureData || !signatureName.trim()}
          size="lg"
          className="min-w-48"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving Signature...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Sign Waiver & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 