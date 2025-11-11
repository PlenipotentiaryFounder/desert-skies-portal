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
  isSaving
}: PersonalInfoStepProps) {
  const [formData, setFormData] = useState({
    first_name: userProfile?.first_name || onboardingData.first_name || '',
    last_name: userProfile?.last_name || onboardingData.last_name || '',
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
  }

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.first_name.trim()) newErrors.push('First name is required')
    if (!formData.last_name.trim()) newErrors.push('Last name is required')
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
      if (age < 18) newErrors.push('You must be at least 18 years old')
    }
    if (!formData.address_line1.trim()) newErrors.push('Address is required')
    if (!formData.city.trim()) newErrors.push('City is required')
    if (!formData.state) newErrors.push('State is required')
    if (!formData.zip_code.trim()) newErrors.push('ZIP code is required')
    
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
        <User className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Personal Information</h2>
        <p className="text-gray-600">
          Please provide your contact information and address
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
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="John"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Doe"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_number">Phone Number *</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                placeholder="(555) 123-4567"
                className="mt-1"
              />
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
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address_line1">Address Line 1 *</Label>
            <Input
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => handleInputChange('address_line1', e.target.value)}
              placeholder="123 Main Street"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => handleInputChange('address_line2', e.target.value)}
              placeholder="Apt, Suite, Unit (optional)"
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
                placeholder="Phoenix"
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
                placeholder="85001"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

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

