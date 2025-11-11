'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Phone, 
  AlertTriangle,
  Check,
  RefreshCw,
  Users
} from 'lucide-react'

interface EmergencyContactStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Relative', 'Guardian', 'Other'
]

export function EmergencyContactStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: EmergencyContactStepProps) {
  const [formData, setFormData] = useState({
    emergency_contact_name: userProfile?.emergency_contact_name || onboardingData.emergency_contact_name || '',
    emergency_contact_phone: userProfile?.emergency_contact_phone || onboardingData.emergency_contact_phone || '',
    emergency_contact_relationship: userProfile?.emergency_contact_relationship || onboardingData.emergency_contact_relationship || ''
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
    
    if (!formData.emergency_contact_name.trim()) {
      newErrors.push('Emergency contact name is required')
    }
    
    if (!formData.emergency_contact_phone.trim()) {
      newErrors.push('Emergency contact phone number is required')
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.emergency_contact_phone)) {
      newErrors.push('Please enter a valid phone number')
    }
    
    if (!formData.emergency_contact_relationship.trim()) {
      newErrors.push('Relationship is required')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    const emergencyData = {
      emergency_contact_name: formData.emergency_contact_name,
      emergency_contact_phone: formData.emergency_contact_phone,
      emergency_contact_relationship: formData.emergency_contact_relationship
    }
    
    onComplete(emergencyData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Phone className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Emergency Contact</h2>
        <p className="text-gray-600">
          Please provide emergency contact information for safety and regulatory compliance
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
            <Users className="w-5 h-5" />
            Emergency Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="emergency_contact_name">Full Name *</Label>
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name}
              onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
              placeholder="Enter emergency contact's full name"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              This person will be contacted in case of emergency during flight training
            </p>
          </div>

          <div>
            <Label htmlFor="emergency_contact_phone">Phone Number *</Label>
            <Input
              id="emergency_contact_phone"
              value={formData.emergency_contact_phone}
              onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
              placeholder="(555) 123-4567"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Primary contact number for emergency situations
            </p>
          </div>

          <div>
            <Label htmlFor="emergency_contact_relationship">Relationship *</Label>
            <Select 
              value={formData.emergency_contact_relationship} 
              onValueChange={(value) => handleInputChange('emergency_contact_relationship', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map(relationship => (
                  <SelectItem key={relationship} value={relationship}>
                    {relationship}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              How is this person related to you?
            </p>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Phone className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Make sure your emergency contact is aware they may be contacted 
          during flight training activities. This information is required by the FAA for all flight 
          training participants.
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
              Saving Contact...
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