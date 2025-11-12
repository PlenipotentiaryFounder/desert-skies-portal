'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle, Check, RefreshCw, Upload, FileText, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'

interface InsuranceStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

export function InsuranceStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: InsuranceStepProps) {
  const [formData, setFormData] = useState({
    insurance_acknowledged: onboardingData.insurance_acknowledged || false,
    insurance_provider: onboardingData.insurance_provider || '',
    insurance_policy_number: onboardingData.insurance_policy_number || '',
    insurance_expiration_date: onboardingData.insurance_expiration_date || '',
    insurance_policy_uploaded: onboardingData.insurance_policy_uploaded || false
  })

  const [uploadedDocument, setUploadedDocument] = useState<any>(
    onboardingData.uploaded_documents?.insurance_policy || null
  )
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const supabase = createClient()

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const uploadDocument = async (file: File) => {
    try {
      if (!userProfile?.id) {
        throw new Error('User profile not found')
      }

      setIsUploading(true)

      if (file.size > 4 * 1024 * 1024) {
        throw new Error('File size must be less than 4MB')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_insurance_policy.${fileExt}`
      const filePath = `${userProfile.id}/${fileName}`

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)
      if (!uploadData?.path) throw new Error('Upload succeeded but no file path returned')

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path)

      setUploadedDocument({
        name: file.name,
        url: publicUrl,
        path: uploadData.path,
        uploaded_at: new Date().toISOString(),
        size: file.size,
        type: file.type
      })

      setFormData(prev => ({ ...prev, insurance_policy_uploaded: true }))

    } catch (error: any) {
      console.error('Upload error:', error)
      setErrors(prev => [...prev, `Failed to upload document: ${error.message}`])
    } finally {
      setIsUploading(false)
    }
  }

  const removeDocument = async () => {
    try {
      if (uploadedDocument?.path) {
        await supabase.storage.from('documents').remove([uploadedDocument.path])
      }
      setUploadedDocument(null)
      setFormData(prev => ({ ...prev, insurance_policy_uploaded: false }))
    } catch (error) {
      console.error('Remove error:', error)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0]
      if (file) uploadDocument(file)
    },
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
    disabled: isUploading
  })

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.insurance_acknowledged) {
      newErrors.push('You must acknowledge the insurance requirement')
    }
    if (!formData.insurance_provider.trim()) {
      newErrors.push('Insurance provider is required')
    }
    if (!formData.insurance_policy_number.trim()) {
      newErrors.push('Policy number is required')
    }
    if (!formData.insurance_expiration_date) {
      newErrors.push('Expiration date is required')
    }
    if (!uploadedDocument) {
      newErrors.push('Insurance policy document must be uploaded')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    
    const data = {
      ...formData,
      uploaded_documents: {
        ...onboardingData.uploaded_documents,
        insurance_policy: uploadedDocument
      }
    }
    
    onComplete(data)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Shield className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Insurance Verification</h2>
        <p className="text-gray-600">
          Confirm your insurance coverage and upload policy documents
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

      <Alert className="bg-yellow-50 border-yellow-200">
        <Shield className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-900">
          <strong>Insurance Requirement:</strong> All flight instructors must maintain current aviation liability insurance 
          with minimum coverage of $1,000,000 per occurrence. You must provide proof of insurance before beginning instruction.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg">
            <Checkbox
              id="insurance_acknowledged"
              checked={formData.insurance_acknowledged}
              onCheckedChange={(checked) => handleInputChange('insurance_acknowledged', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="insurance_acknowledged" className="cursor-pointer text-sm leading-relaxed">
              I acknowledge that I am required to maintain aviation liability insurance with minimum coverage of 
              $1,000,000 per occurrence, and I confirm that I have obtained such insurance coverage.
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="insurance_provider">Insurance Provider *</Label>
            <Input
              id="insurance_provider"
              value={formData.insurance_provider}
              onChange={(e) => handleInputChange('insurance_provider', e.target.value)}
              placeholder="e.g., AOPA, Avemco, Global Aerospace"
              className="mt-1"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insurance_policy_number">Policy Number *</Label>
              <Input
                id="insurance_policy_number"
                value={formData.insurance_policy_number}
                onChange={(e) => handleInputChange('insurance_policy_number', e.target.value)}
                placeholder="Policy number"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="insurance_expiration_date">Expiration Date *</Label>
              <Input
                id="insurance_expiration_date"
                type="date"
                value={formData.insurance_expiration_date}
                onChange={(e) => handleInputChange('insurance_expiration_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Upload Insurance Policy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Upload a copy of your current insurance policy or declaration page
          </p>

          {!uploadedDocument ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, JPEG, PNG (max 4MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{uploadedDocument.name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(uploadedDocument.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeDocument}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="mt-4 text-center">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-sm text-gray-600 mt-2">Uploading...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center pt-6">
        <Button onClick={handleSubmit} disabled={isSaving || isUploading} size="lg" className="min-w-48">
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

