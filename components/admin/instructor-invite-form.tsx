'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, 
  Send, 
  Copy, 
  Check, 
  AlertTriangle, 
  Clock,
  UserPlus,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

interface InstructorInviteFormProps {
  existingInvitations: any[]
}

export function InstructorInviteForm({ existingInvitations }: InstructorInviteFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    isAdmin: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setInviteUrl(null)

    try {
      const roles = formData.isAdmin ? ['instructor', 'admin'] : ['instructor']

      const response = await fetch('/api/admin/instructors/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          roles
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create invitation')
      }

      setInviteUrl(data.invitation.inviteUrl)
      toast.success('Invitation created successfully!')

      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        isAdmin: false
      })

      // Refresh the page to show new invitation
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (err: any) {
      console.error('Error creating invitation:', err)
      setError(err.message || 'Failed to create invitation')
      toast.error(err.message || 'Failed to create invitation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(label)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const getInvitationStatus = (invitation: any) => {
    if (invitation.used) {
      return <Badge variant="secondary">Used</Badge>
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  return (
    <div className="space-y-8">
      {/* Invitation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Create New Invitation
          </CardTitle>
          <CardDescription>
            Enter the instructor's information to generate an invitation link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-4">
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
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="instructor@example.com"
                required
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                The invitation will be sent to this email address
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAdmin"
                checked={formData.isAdmin}
                onCheckedChange={(checked) => handleInputChange('isAdmin', checked as boolean)}
              />
              <Label htmlFor="isAdmin" className="cursor-pointer">
                Grant admin privileges (instructor + admin roles)
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating Invitation...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </form>

          {inviteUrl && (
            <Alert className="mt-6 bg-green-50 border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="font-semibold text-green-900 mb-2">Invitation created successfully!</p>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={inviteUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(inviteUrl, 'url')}
                  >
                    {copiedToken === 'url' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  An email has been sent to the instructor with this link. You can also share it directly.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Existing Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Recent Invitations
          </CardTitle>
          <CardDescription>
            View and manage existing instructor invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingInvitations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No invitations yet. Create your first invitation above.
            </p>
          ) : (
            <div className="space-y-4">
              {existingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-medium">{invitation.email}</p>
                      {getInvitationStatus(invitation)}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Invited {new Date(invitation.invited_at).toLocaleDateString()}
                      </span>
                      {invitation.roles && invitation.roles.length > 1 && (
                        <Badge variant="outline" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                    {!invitation.used && new Date(invitation.expires_at) > new Date() && (
                      <div className="flex items-center gap-2 mt-2">
                        <Input
                          value={`${process.env.NEXT_PUBLIC_APP_URL || ''}/instructor/onboarding/accept?token=${invitation.token}`}
                          readOnly
                          className="text-xs font-mono"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(
                            `${process.env.NEXT_PUBLIC_APP_URL || ''}/instructor/onboarding/accept?token=${invitation.token}`,
                            invitation.id
                          )}
                        >
                          {copiedToken === invitation.id ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

