'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Plane, 
  AlertTriangle,
  Check,
  RefreshCw,
  Award,
  FileText
} from 'lucide-react'

interface AviationBackgroundStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

const PILOT_CERTIFICATES = [
  'None (Student Pilot)',
  'Student Pilot',
  'Sport Pilot',
  'Recreational Pilot',
  'Private Pilot',
  'Commercial Pilot',
  'Airline Transport Pilot'
]

const MEDICAL_CLASSES = [
  'None Required',
  'First Class',
  'Second Class', 
  'Third Class',
  'BasicMed'
]

// TODO: Consider moving to database or configuration file
const CITIZENSHIP_STATUS = [
  'U.S. Citizen',
  'Permanent Resident',
  'Foreign National'
]

export function AviationBackgroundStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: AviationBackgroundStepProps) {
  const [formData, setFormData] = useState({
    pilot_certificate_type: userProfile?.pilot_certificate_type || onboardingData.pilot_certificate_type || '',
    pilot_certificate_number: userProfile?.pilot_certificate_number || onboardingData.pilot_certificate_number || '',
    medical_certificate_class: userProfile?.medical_certificate_class || onboardingData.medical_certificate_class || '',
    medical_certificate_expires_at: userProfile?.medical_certificate_expires_at || onboardingData.medical_certificate_expires_at || '',
    tsa_citizenship_status: userProfile?.tsa_citizenship_status || onboardingData.tsa_citizenship_status || ''
  })

  const [errors, setErrors] = useState<string[]>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.pilot_certificate_type.trim()) {
      newErrors.push('Pilot certificate type is required')
    }
    
    if (!formData.tsa_citizenship_status.trim()) {
      newErrors.push('Citizenship status is required')
    }
    
    // If they have a certificate other than "None", require certificate number
    if (formData.pilot_certificate_type && 
        formData.pilot_certificate_type !== 'None (Student Pilot)' && 
        !formData.pilot_certificate_number.trim()) {
      newErrors.push('Certificate number is required for existing certificates')
    }
    
    // If they have a medical certificate, require expiration date
    if (formData.medical_certificate_class && 
        formData.medical_certificate_class !== 'None Required' && 
        !formData.medical_certificate_expires_at) {
      newErrors.push('Medical certificate expiration date is required')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    const aviationData = {
      pilot_certificate_type: formData.pilot_certificate_type,
      pilot_certificate_number: formData.pilot_certificate_number,
      medical_certificate_class: formData.medical_certificate_class,
      medical_certificate_expires_at: formData.medical_certificate_expires_at,
      tsa_citizenship_status: formData.tsa_citizenship_status
    }
    
    onComplete(aviationData)
  }

  const needsCertificateNumber = formData.pilot_certificate_type && 
    formData.pilot_certificate_type !== 'None (Student Pilot)'
  
  const needsMedicalExpiration = formData.medical_certificate_class && 
    formData.medical_certificate_class !== 'None Required'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Plane className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Aviation Background</h2>
        <p className="text-gray-600">
          Please provide information about your current pilot certificates and experience
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

      <div className="space-y-6">
        {/* Pilot Certificate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Pilot Certificate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pilot_certificate_type">Current Pilot Certificate *</Label>
              <Select 
                value={formData.pilot_certificate_type} 
                onValueChange={(value) => handleInputChange('pilot_certificate_type', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your current certificate level" />
                </SelectTrigger>
                <SelectContent>
                  {PILOT_CERTIFICATES.map(cert => (
                    <SelectItem key={cert} value={cert}>
                      {cert}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Select your highest pilot certificate level
              </p>
            </div>

            {needsCertificateNumber && (
              <div>
                <Label htmlFor="pilot_certificate_number">Certificate Number *</Label>
                <Input
                  id="pilot_certificate_number"
                  value={formData.pilot_certificate_number}
                  onChange={(e) => handleInputChange('pilot_certificate_number', e.target.value)}
                  placeholder="Enter your certificate number"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Found on your pilot certificate
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Certificate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Medical Certificate
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="medical_certificate_class">Medical Certificate Class</Label>
              <Select 
                value={formData.medical_certificate_class} 
                onValueChange={(value) => handleInputChange('medical_certificate_class', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your medical certificate class" />
                </SelectTrigger>
                <SelectContent>
                  {MEDICAL_CLASSES.map(medical => (
                    <SelectItem key={medical} value={medical}>
                      {medical}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Required for most pilot certificates
              </p>
            </div>

            {needsMedicalExpiration && (
              <div>
                <Label htmlFor="medical_certificate_expires_at">Medical Certificate Expiration *</Label>
                <Input
                  id="medical_certificate_expires_at"
                  type="date"
                  value={formData.medical_certificate_expires_at}
                  onChange={(e) => handleInputChange('medical_certificate_expires_at', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  When does your medical certificate expire?
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* TSA Citizenship Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              TSA Citizenship Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Citizenship Status *</Label>
              <RadioGroup 
                value={formData.tsa_citizenship_status} 
                onValueChange={(value) => handleInputChange('tsa_citizenship_status', value)}
                className="mt-2"
              >
                {CITIZENSHIP_STATUS.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <RadioGroupItem value={status} id={status} />
                    <Label htmlFor={status}>{status}</Label>
                  </div>
                ))}
              </RadioGroup>
              <p className="text-xs text-gray-500 mt-1">
                Required for TSA compliance and flight training eligibility
              </p>
            </div>

            {formData.tsa_citizenship_status === 'Foreign National' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Additional Requirements:</strong> As a foreign national, you will need to 
                  complete additional TSA Alien Flight Student Program (AFSP) requirements before 
                  beginning flight training. We'll help guide you through this process.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Document Upload:</strong> You'll be able to upload copies of your certificates 
          and medical in the next steps. This information helps us ensure you meet all FAA 
          requirements for flight training.
        </AlertDescription>
      </Alert>

      <div className="flex justify-center pt-6">
        <Button
          onClick={handleSubmit}
          disabled={isSaving}
          size="lg"
          className="min-w-48"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving Background...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Save & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  )
} 