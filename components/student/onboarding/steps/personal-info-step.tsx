'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertTriangle,
  Check,
  RefreshCw
} from 'lucide-react'

interface PersonalInfoStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  onSave: (data: any) => void
  isSaving: boolean
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
]

export function PersonalInfoStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  onSave,
  isSaving
}: PersonalInfoStepProps) {
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    phone_number: userProfile?.phone_number || onboardingData.phone_number || '',
    date_of_birth: userProfile?.date_of_birth || onboardingData.date_of_birth || '',
    address_line1: userProfile?.address_line1 || onboardingData.address_line1 || '',
    address_line2: userProfile?.address_line2 || onboardingData.address_line2 || '',
    city: userProfile?.city || onboardingData.city || '',
    state: userProfile?.state || onboardingData.state || '',
    zip_code: userProfile?.zip_code || onboardingData.zip_code || '',
    country: userProfile?.country || onboardingData.country || 'United States'
  })

  const [errors, setErrors] = useState<string[]>([])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Auto-save on change
    onSave({ [field]: value })
  }

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.full_name.trim()) {
      newErrors.push('Full name is required')
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.push('Phone number is required')
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone_number)) {
      newErrors.push('Please enter a valid phone number')
    }
    
    if (!formData.date_of_birth) {
      newErrors.push('Date of birth is required')
    } else {
      const birthDate = new Date(formData.date_of_birth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 16) {
        newErrors.push('You must be at least 16 years old to begin flight training')
      }
    }
    
    if (!formData.address_line1.trim()) {
      newErrors.push('Address is required')
    }
    
    if (!formData.city.trim()) {
      newErrors.push('City is required')
    }
    
    if (!formData.state.trim()) {
      newErrors.push('State is required')
    }
    
    if (!formData.zip_code.trim()) {
      newErrors.push('ZIP code is required')
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.push('Please enter a valid ZIP code')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    // Update both profile and onboarding data
    const profileData = {
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      date_of_birth: formData.date_of_birth,
      address_line1: formData.address_line1,
      address_line2: formData.address_line2,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      country: formData.country
    }
    
    onComplete(profileData)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <User className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Personal Information</h2>
        <p className="text-gray-600">
          Please provide your contact details and basic information for our records
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
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Legal Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full legal name"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must match your government-issued ID
                </p>
              </div>
              
              <div>
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 16 years old
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="(555) 123-4567"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Primary contact number for scheduling and emergencies
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Address Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address_line1">Address Line 1 *</Label>
              <Input
                id="address_line1"
                value={formData.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
                placeholder="Street address"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                value={formData.address_line2}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
                placeholder="Apartment, suite, etc. (optional)"
                className="mt-1"
              />
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="state">State *</Label>
                <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="zip_code">ZIP Code *</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => handleInputChange('zip_code', e.target.value)}
                  placeholder="12345"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="country">Country</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

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
              Saving Information...
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