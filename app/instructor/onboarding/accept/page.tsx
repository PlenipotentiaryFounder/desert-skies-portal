'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: ''
  })

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link')
      setIsVerifying(false)
      return
    }

    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/instructor/onboarding/accept-invite?token=${token}`)
      const data = await response.json()

      if (!response.ok || !data.valid) {
        setError(data.error || 'Invalid or expired invitation')
        setIsValid(false)
      } else {
        setIsValid(true)
        setInvitationData(data.invitation)
        
        // Pre-fill names if available in metadata
        if (data.invitation.metadata) {
          setFormData(prev => ({
            ...prev,
            firstName: data.invitation.metadata.first_name || '',
            lastName: data.invitation.metadata.last_name || ''
          }))
        }
      }
    } catch (err: any) {
      console.error('Error verifying token:', err)
      setError('Failed to verify invitation')
      setIsValid(false)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      toast.error('First name is required')
      return false
    }
    if (!formData.lastName.trim()) {
      toast.error('Last name is required')
      return false
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/instructor/onboarding/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account')
      }

      toast.success('Account created successfully!')
      
      // Redirect to onboarding
      setTimeout(() => {
        router.push('/instructor/onboarding')
      }, 1000)

    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      setError(err.message || 'Failed to create account')
      toast.error(err.message || 'Failed to create account')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Verifying invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || 'This invitation link is invalid or has expired.'}
              </AlertDescription>
            </Alert>
            <p className="text-sm text-gray-600 mt-4">
              Please contact your administrator for a new invitation link.
            </p>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full mt-4"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">
            Welcome to Desert Skies Aviation!
          </CardTitle>
          <CardDescription className="text-center">
            Create your instructor account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationData && (
            <Alert className="mb-6 bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <p className="text-sm text-blue-900">
                  You've been invited to join as an instructor
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Email: <strong>{invitationData.email}</strong>
                </p>
                {invitationData.roles?.includes('admin') && (
                  <p className="text-xs text-blue-700 mt-1">
                    Roles: <strong>Instructor + Admin</strong>
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="John"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Doe"
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  className="mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 8 characters long
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account & Continue'
              )}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500 mt-6">
            By creating an account, you agree to complete the onboarding process and provide necessary documentation.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}

