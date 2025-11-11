'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, AlertTriangle, Check, RefreshCw, PenTool, Download } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'

interface ContractorAgreementStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

export function ContractorAgreementStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: ContractorAgreementStepProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [formData, setFormData] = useState({
    contractor_agreement_signed: onboardingData.contractor_agreement_signed || false,
    acknowledged_terms: false,
    acknowledged_independent_contractor: false,
    acknowledged_insurance: false,
    acknowledged_taxes: false,
    acknowledged_no_guarantee: false,
    acknowledged_at_will: false
  })
  const [signature, setSignature] = useState<string | null>(
    onboardingData.contractor_agreement_signature_data || null
  )
  const [errors, setErrors] = useState<string[]>([])
  const [showContract, setShowContract] = useState(false)

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  const clearSignature = () => {
    sigCanvas.current?.clear()
    setSignature(null)
  }

  const saveSignature = () => {
    if (sigCanvas.current) {
      const signatureData = sigCanvas.current.toDataURL()
      setSignature(signatureData)
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.acknowledged_terms) newErrors.push('You must acknowledge reading the full agreement')
    if (!formData.acknowledged_independent_contractor) newErrors.push('You must acknowledge independent contractor status')
    if (!formData.acknowledged_insurance) newErrors.push('You must acknowledge insurance requirements')
    if (!formData.acknowledged_taxes) newErrors.push('You must acknowledge tax responsibilities')
    if (!formData.acknowledged_no_guarantee) newErrors.push('You must acknowledge no guaranteed hours')
    if (!formData.acknowledged_at_will) newErrors.push('You must acknowledge at-will relationship')
    
    if (!signature) newErrors.push('Electronic signature is required')
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    // Get IP address for record
    let ipAddress = 'unknown'
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json')
      const ipData = await ipResponse.json()
      ipAddress = ipData.ip
    } catch (error) {
      console.error('Failed to get IP address:', error)
    }
    
    const data = {
      contractor_agreement_signed: true,
      contractor_agreement_signed_at: new Date().toISOString(),
      contractor_agreement_ip_address: ipAddress,
      contractor_agreement_signature_data: signature,
      ...formData
    }
    
    onComplete(data)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <FileText className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Independent Contractor Agreement</h2>
        <p className="text-gray-600">
          Please review and sign the 1099 contractor agreement
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

      <Alert className="bg-blue-50 border-blue-200">
        <FileText className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <strong>Important:</strong> This is a legal agreement that defines your relationship with Desert Skies Aviation as an independent contractor. 
          Please read it carefully before signing.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Contract Summary</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContract(!showContract)}
            >
              {showContract ? 'Hide Full Contract' : 'View Full Contract'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-gray-900">Key Terms:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><strong>Independent Contractor Status:</strong> You are not an employee and are responsible for your own taxes</li>
              <li><strong>Compensation:</strong> $50/hour for flight instruction, ground instruction, and briefings (as specified in Rate Schedule)</li>
              <li><strong>Insurance Required:</strong> $1,000,000 liability coverage, $100,000 hull coverage, and $1,000,000 professional liability</li>
              <li><strong>Payment:</strong> Invoiced and paid within 15 days, or via instant payment portal</li>
              <li><strong>Termination:</strong> Either party may terminate with 14 days notice</li>
              <li><strong>Non-Solicitation:</strong> 12-month restriction on soliciting DSA students after termination</li>
              <li><strong>FAA Compliance:</strong> You must maintain all required certificates and comply with all FARs</li>
            </ul>
          </div>

          {showContract && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto text-xs">
              <pre className="whitespace-pre-wrap font-sans">
{`DSA INDEPENDENT CONTRACTOR AGREEMENT

This Independent Contractor Agreement is entered into by and between Desert Skies Aviation Training, LLC 
("DSA") and the undersigned certified flight instructor ("Contractor").

1. INDEPENDENT CONTRACTOR RELATIONSHIP
You are engaged as an independent contractor, not as an employee. You are responsible for:
- All federal, state, and local taxes
- Self-employment taxes
- Obtaining required insurance
- No employee benefits are provided

2. SCOPE OF SERVICES
You will provide flight training, ground training, and related services in accordance with:
- All Federal Aviation Regulations (FARs)
- FAA Advisory Circulars
- DSA safety and operational policies
- Maintaining current certificates and medical

3. COMPENSATION
Rates as specified in Exhibit B (Rate Schedule):
- Flight Instruction: $50/hour
- Ground Instruction: $50/hour  
- Briefing Time: $50/hour
Payment within 15 days of invoice submission

4. INSURANCE REQUIREMENTS
You must maintain:
- Non-Owned Aircraft Liability: $1,000,000 per occurrence / $200,000 per passenger
- Physical Damage (Hull): $100,000 minimum
- Professional Liability: $1,000,000 per occurrence

5. INDEMNIFICATION
You agree to defend, indemnify, and hold harmless DSA from claims arising from your services, 
except for DSA's gross negligence or willful misconduct.

6. CONFIDENTIALITY
Maintain confidentiality of DSA's proprietary information, student data, and business practices.

7. STUDENT RELATIONSHIPS
Students engaged through DSA are DSA's clients. 12-month non-solicitation period applies after termination.

8. TERM AND TERMINATION
Agreement continues until terminated by either party with 14 days notice. 
Immediate termination for cause (certificate suspension, insurance lapse, safety violations, etc.).

For full contract details, see the complete DSA Independent Contractor Agreement.`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acknowledgments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Please confirm that you have read and understand the following:
          </p>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id="acknowledged_terms"
                checked={formData.acknowledged_terms}
                onCheckedChange={(checked) => handleCheckboxChange('acknowledged_terms', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="acknowledged_terms" className="cursor-pointer text-sm leading-relaxed">
                I have read and understand the complete Independent Contractor Agreement, including all exhibits
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id="acknowledged_independent_contractor"
                checked={formData.acknowledged_independent_contractor}
                onCheckedChange={(checked) => handleCheckboxChange('acknowledged_independent_contractor', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="acknowledged_independent_contractor" className="cursor-pointer text-sm leading-relaxed">
                I understand that I am an <strong>independent contractor</strong>, not an employee, and I am responsible for all taxes and insurance
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id="acknowledged_insurance"
                checked={formData.acknowledged_insurance}
                onCheckedChange={(checked) => handleCheckboxChange('acknowledged_insurance', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="acknowledged_insurance" className="cursor-pointer text-sm leading-relaxed">
                I acknowledge the insurance requirements and will maintain the required coverage limits at all times
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id="acknowledged_taxes"
                checked={formData.acknowledged_taxes}
                onCheckedChange={(checked) => handleCheckboxChange('acknowledged_taxes', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="acknowledged_taxes" className="cursor-pointer text-sm leading-relaxed">
                I understand that DSA will not withhold taxes and I am solely responsible for all tax obligations, including self-employment tax
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id="acknowledged_no_guarantee"
                checked={formData.acknowledged_no_guarantee}
                onCheckedChange={(checked) => handleCheckboxChange('acknowledged_no_guarantee', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="acknowledged_no_guarantee" className="cursor-pointer text-sm leading-relaxed">
                I understand that DSA does not guarantee any minimum number of flight hours or earnings
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <Checkbox
                id="acknowledged_at_will"
                checked={formData.acknowledged_at_will}
                onCheckedChange={(checked) => handleCheckboxChange('acknowledged_at_will', checked as boolean)}
                className="mt-1"
              />
              <Label htmlFor="acknowledged_at_will" className="cursor-pointer text-sm leading-relaxed">
                I understand that either party may terminate this agreement at any time with 14 days notice
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="w-5 h-5" />
            Electronic Signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            By signing below, you agree to all terms and conditions of the Independent Contractor Agreement.
          </p>

          {!signature ? (
            <>
              <div className="border-2 border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={sigCanvas}
                  canvasProps={{
                    className: 'w-full h-40 cursor-crosshair',
                    style: { touchAction: 'none' }
                  }}
                  backgroundColor="white"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={clearSignature}>
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={saveSignature}>
                  <Check className="w-4 h-4 mr-2" />
                  Save Signature
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="border-2 border-green-200 rounded-lg bg-green-50 p-4">
                <img src={signature} alt="Your signature" className="max-h-32 mx-auto" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="w-4 h-4" />
                  <span>Signature captured</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSignature(null)}>
                  Re-sign
                </Button>
              </div>
            </div>
          )}

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900 text-xs">
              Your electronic signature is legally binding. The date, time, and IP address will be recorded.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6">
        <Button onClick={handleSubmit} disabled={isSaving || !signature} size="lg" className="min-w-48">
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving Agreement...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Sign & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

