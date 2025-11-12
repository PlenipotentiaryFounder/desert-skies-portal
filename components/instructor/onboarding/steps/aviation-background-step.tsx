'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plane, AlertTriangle, Check, RefreshCw, Award } from 'lucide-react'

interface AviationBackgroundStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

export function AviationBackgroundStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: AviationBackgroundStepProps) {
  const [formData, setFormData] = useState({
    cfi_certificate_number: onboardingData.cfi_certificate_number || '',
    cfi_expiration_date: onboardingData.cfi_expiration_date || '',
    cfii_certificate: onboardingData.cfii_certificate || false,
    cfii_expiration_date: onboardingData.cfii_expiration_date || '',
    mei_certificate: onboardingData.mei_certificate || false,
    mei_expiration_date: onboardingData.mei_expiration_date || '',
    pilot_certificate_number: onboardingData.pilot_certificate_number || '',
    pilot_certificate_type: onboardingData.pilot_certificate_type || '',
    medical_certificate_class: onboardingData.medical_certificate_class || '',
    medical_expiration_date: onboardingData.medical_expiration_date || '',
    total_flight_hours: onboardingData.total_flight_hours || '',
    total_instruction_hours: onboardingData.total_instruction_hours || ''
  })

  const [errors, setErrors] = useState<string[]>([])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.cfi_certificate_number.trim()) newErrors.push('CFI certificate number is required')
    if (!formData.cfi_expiration_date) newErrors.push('CFI expiration date is required')
    if (!formData.pilot_certificate_number.trim()) newErrors.push('Pilot certificate number is required')
    if (!formData.pilot_certificate_type) newErrors.push('Pilot certificate type is required')
    if (!formData.medical_certificate_class) newErrors.push('Medical certificate class is required')
    if (!formData.medical_expiration_date) newErrors.push('Medical expiration date is required')
    if (!formData.total_flight_hours) newErrors.push('Total flight hours is required')
    if (!formData.total_instruction_hours) newErrors.push('Total instruction hours is required')
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    onComplete(formData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Plane className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold text-gray-900">Aviation Credentials</h2>
        <p className="text-gray-700">
          Please provide your flight instructor certificates and experience
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            CFI Certificate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cfi_certificate_number">CFI Certificate Number *</Label>
              <Input
                id="cfi_certificate_number"
                value={formData.cfi_certificate_number}
                onChange={(e) => handleInputChange('cfi_certificate_number', e.target.value)}
                placeholder="1234567CFI"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="cfi_expiration_date">CFI Expiration Date *</Label>
              <Input
                id="cfi_expiration_date"
                type="date"
                value={formData.cfi_expiration_date}
                onChange={(e) => handleInputChange('cfi_expiration_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cfii_certificate"
                checked={formData.cfii_certificate}
                onCheckedChange={(checked) => handleInputChange('cfii_certificate', checked as boolean)}
              />
              <Label htmlFor="cfii_certificate" className="cursor-pointer">
                I hold a CFII (Certified Flight Instructor - Instrument) certificate
              </Label>
            </div>
            
            {formData.cfii_certificate && (
              <div>
                <Label htmlFor="cfii_expiration_date">CFII Expiration Date</Label>
                <Input
                  id="cfii_expiration_date"
                  type="date"
                  value={formData.cfii_expiration_date}
                  onChange={(e) => handleInputChange('cfii_expiration_date', e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mei_certificate"
                checked={formData.mei_certificate}
                onCheckedChange={(checked) => handleInputChange('mei_certificate', checked as boolean)}
              />
              <Label htmlFor="mei_certificate" className="cursor-pointer">
                I hold an MEI (Multi-Engine Instructor) certificate
              </Label>
            </div>
            
            {formData.mei_certificate && (
              <div>
                <Label htmlFor="mei_expiration_date">MEI Expiration Date</Label>
                <Input
                  id="mei_expiration_date"
                  type="date"
                  value={formData.mei_expiration_date}
                  onChange={(e) => handleInputChange('mei_expiration_date', e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pilot Certificate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pilot_certificate_number">Pilot Certificate Number *</Label>
              <Input
                id="pilot_certificate_number"
                value={formData.pilot_certificate_number}
                onChange={(e) => handleInputChange('pilot_certificate_number', e.target.value)}
                placeholder="1234567"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pilot_certificate_type">Certificate Type *</Label>
              <Select value={formData.pilot_certificate_type} onValueChange={(value) => handleInputChange('pilot_certificate_type', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="atp">ATP (Airline Transport Pilot)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Medical Certificate</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="medical_certificate_class">Medical Class *</Label>
              <Select value={formData.medical_certificate_class} onValueChange={(value) => handleInputChange('medical_certificate_class', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First Class</SelectItem>
                  <SelectItem value="second">Second Class</SelectItem>
                  <SelectItem value="third">Third Class</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="medical_expiration_date">Medical Expiration Date *</Label>
              <Input
                id="medical_expiration_date"
                type="date"
                value={formData.medical_expiration_date}
                onChange={(e) => handleInputChange('medical_expiration_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flight Experience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_flight_hours">Total Flight Hours *</Label>
              <Input
                id="total_flight_hours"
                type="number"
                step="0.1"
                value={formData.total_flight_hours}
                onChange={(e) => handleInputChange('total_flight_hours', e.target.value)}
                placeholder="1500.0"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="total_instruction_hours">Total Instruction Hours *</Label>
              <Input
                id="total_instruction_hours"
                type="number"
                step="0.1"
                value={formData.total_instruction_hours}
                onChange={(e) => handleInputChange('total_instruction_hours', e.target.value)}
                placeholder="500.0"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6">
        <Button onClick={handleSubmit} disabled={isSaving} size="lg" className="min-w-48">
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
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

