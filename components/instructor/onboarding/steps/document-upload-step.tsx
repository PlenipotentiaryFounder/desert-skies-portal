'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Camera,
  Download,
  Award,
  CreditCard
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

interface DocumentUploadStepProps {
  onboardingData: any
  userProfile: any
  onComplete: (data: any) => void
  onSkip: () => void
  isSaving: boolean
}

const REQUIRED_INSTRUCTOR_DOCUMENTS = [
  {
    id: 'government_id',
    name: 'Government Issued ID',
    description: 'Driver\'s license, passport, or state ID',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    icon: CreditCard
  },
  {
    id: 'pilot_certificate',
    name: 'Pilot Certificate',
    description: 'Your current pilot certificate (Commercial or ATP)',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    icon: Award
  },
  {
    id: 'cfi_certificate',
    name: 'CFI Certificate',
    description: 'Current CFI certificate',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    icon: Award
  },
  {
    id: 'medical_certificate',
    name: 'Medical Certificate',
    description: 'Current FAA medical certificate',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    icon: FileText
  },
  {
    id: 'birth_certificate',
    name: 'Birth Certificate or Passport',
    description: 'Proof of citizenship or eligibility (TSA requirement)',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
    icon: FileText
  }
]

export function DocumentUploadStep({
  onboardingData,
  userProfile,
  onComplete,
  onSkip,
  isSaving
}: DocumentUploadStepProps) {
  const [uploadedDocuments, setUploadedDocuments] = useState(
    onboardingData.uploaded_documents || {}
  )
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [expirationDates, setExpirationDates] = useState<{ [key: string]: string }>(
    onboardingData.document_expiration_dates || {}
  )
  const [errors, setErrors] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const supabase = createClient()

  const uploadDocument = async (file: File, documentType: string) => {
    try {
      // Validate user profile
      if (!userProfile?.id) {
        throw new Error('User profile not found. Please refresh the page and try again.')
      }

      setIsUploading(true)
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }))

      // Check file size (4MB limit to match storage bucket policy)
      if (file.size > 4 * 1024 * 1024) {
        throw new Error('File size must be less than 4MB')
      }

      // Validate file type
      const documentConfig = REQUIRED_INSTRUCTOR_DOCUMENTS.find(doc => doc.id === documentType)
      if (!documentConfig?.acceptedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not accepted for ${documentType}`)
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${documentType}.${fileExt}`
      // Correct file path: instructor documents go in their own folder by user ID
      const filePath = `${userProfile.id}/${fileName}`

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[documentType] || 0
          if (current < 90) {
            return { ...prev, [documentType]: current + 10 }
          }
          return prev
        })
      }, 200)

      // Upload to Supabase Storage - 'documents' bucket
      console.log('Uploading instructor document:', {
        filePath,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
        userId: userProfile.id,
        documentType
      })
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)
      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }))

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      if (!uploadData?.path) {
        console.error('Upload succeeded but no file path returned:', uploadData)
        throw new Error('Upload succeeded but no file path returned')
      }

      // Insert metadata into documents table
      const documentMetadata: Database['public']['Tables']['documents']['Insert'] = {
        user_id: userProfile.id,
        title: file.name,
        description: `Instructor ${documentType} uploaded during onboarding`,
        file_path: uploadData.path,
        file_type: file.type,
        document_type: documentType,
        expiration_date: expirationDates[documentType] || null,
        is_verified: false,
      }
      
      const { error: insertError } = await supabase
        .from('documents')
        .insert([documentMetadata])
        
      if (insertError) {
        console.error('Failed to insert document metadata:', insertError)
        // Try to clean up the uploaded file if metadata insertion fails
        await supabase.storage.from('documents').remove([uploadData.path])
        throw new Error(`Failed to save document metadata: ${insertError.message}`)
      }

      // Get public URL (note: may not be accessible due to RLS, but stored for reference)
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path)

      // Update uploaded documents state
      const newDocuments = {
        ...uploadedDocuments,
        [documentType]: {
          name: file.name,
          url: publicUrl,
          path: uploadData.path,
          uploaded_at: new Date().toISOString(),
          size: file.size,
          type: file.type,
          expiration_date: expirationDates[documentType] || null
        }
      }

      setUploadedDocuments(newDocuments)

      // Update onboarding data flags based on document type
      const updateData: any = {
        uploaded_documents: newDocuments
      }
      
      // Set specific upload flags
      switch(documentType) {
        case 'government_id':
          updateData.government_id_uploaded = true
          break
        case 'pilot_certificate':
          updateData.pilot_certificate_uploaded = true
          break
        case 'cfi_certificate':
          updateData.cfi_certificate_uploaded = true
          break
        case 'medical_certificate':
          updateData.medical_certificate_uploaded = true
          break
        case 'birth_certificate':
          updateData.birth_certificate_uploaded = true
          break
      }

      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [documentType]: 0 }))
      }, 1000)

    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error?.message || 'Unknown upload error occurred'
      setErrors(prev => [...prev, `Failed to upload ${documentType}: ${errorMessage}`])
    } finally {
      setIsUploading(false)
    }
  }

  const removeDocument = async (documentType: string) => {
    try {
      const document = uploadedDocuments[documentType]
      if (document?.path) {
        const { error: removeError } = await supabase.storage
          .from('documents')
          .remove([document.path])
        
        if (removeError) {
          console.error('Failed to remove file from storage:', removeError)
        }
        
        // Also remove from documents table
        await supabase
          .from('documents')
          .delete()
          .eq('user_id', userProfile.id)
          .eq('document_type', documentType)
      }

      const newDocuments = { ...uploadedDocuments }
      delete newDocuments[documentType]
      setUploadedDocuments(newDocuments)

      // Clear expiration date
      const newExpirations = { ...expirationDates }
      delete newExpirations[documentType]
      setExpirationDates(newExpirations)

    } catch (error) {
      console.error('Remove error:', error)
    }
  }

  const handleExpirationDateChange = (documentType: string, date: string) => {
    setExpirationDates(prev => ({
      ...prev,
      [documentType]: date
    }))
  }

  const validateDocuments = () => {
    const newErrors: string[] = []
    
    const requiredDocs = REQUIRED_INSTRUCTOR_DOCUMENTS.filter(doc => doc.required)
    for (const doc of requiredDocs) {
      if (!uploadedDocuments[doc.id]) {
        newErrors.push(`${doc.name} is required`)
      }
    }
    
    // Validate expiration dates for critical documents
    if (uploadedDocuments.cfi_certificate && !expirationDates.cfi_certificate) {
      newErrors.push('CFI certificate expiration date is required')
    }
    if (uploadedDocuments.medical_certificate && !expirationDates.medical_certificate) {
      newErrors.push('Medical certificate expiration date is required')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleComplete = () => {
    if (validateDocuments()) {
      onComplete({ 
        uploaded_documents: uploadedDocuments,
        document_expiration_dates: expirationDates,
        document_upload_completed: true
      })
    }
  }

  const DocumentUploadCard = ({ document }: { document: any }) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        uploadDocument(file, document.id)
      }
    }, [document.id])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: document.acceptedTypes.reduce((acc: Record<string, string[]>, type: string) => {
        acc[type] = []
        return acc
      }, {} as Record<string, string[]>),
      maxFiles: 1,
      maxSize: 4 * 1024 * 1024,
      preventDropOnDocument: true,
      disabled: isUploading
    })

    const isUploaded = uploadedDocuments[document.id]
    const progress = uploadProgress[document.id] || 0
    const needsExpiration = ['cfi_certificate', 'medical_certificate'].includes(document.id)

    return (
      <Card className="relative">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <document.icon className="w-5 h-5" />
              <span>{document.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {document.required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
              {isUploaded && (
                <Badge variant="default" className="text-xs bg-green-600">Uploaded</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{document.description}</p>
          
          {!isUploaded ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {isDragActive 
                  ? 'Drop the file here...' 
                  : 'Drag & drop a file here, or click to select'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, JPEG, PNG (max 4MB)
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-3">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{uploadedDocuments[document.id].name}</p>
                    <p className="text-xs text-gray-500">
                      Uploaded {new Date(uploadedDocuments[document.id].uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeDocument(document.id)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {needsExpiration && (
                <div>
                  <Label htmlFor={`expiration_${document.id}`} className="text-sm">
                    Expiration Date *
                  </Label>
                  <Input
                    id={`expiration_${document.id}`}
                    type="date"
                    value={expirationDates[document.id] || ''}
                    onChange={(e) => handleExpirationDateChange(document.id, e.target.value)}
                    className="mt-1"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the expiration date shown on your certificate
                  </p>
                </div>
              )}
            </>
          )}

          {progress > 0 && progress < 100 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const getUploadProgress = () => {
    const total = REQUIRED_INSTRUCTOR_DOCUMENTS.length
    const uploaded = Object.keys(uploadedDocuments).length
    return Math.round((uploaded / total) * 100)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Upload className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold">Document Upload</h2>
        <p className="text-gray-600">
          Upload your flight instructor credentials and identification documents
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Upload Progress</span>
            <Badge variant="outline">
              {Object.keys(uploadedDocuments).length} of {REQUIRED_INSTRUCTOR_DOCUMENTS.length} documents
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={getUploadProgress()} className="h-2" />
          <p className="text-sm text-gray-600 mt-2">
            {getUploadProgress()}% complete
          </p>
        </CardContent>
      </Card>

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

      {/* Document Upload Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {REQUIRED_INSTRUCTOR_DOCUMENTS.map((document) => (
          <DocumentUploadCard key={document.id} document={document} />
        ))}
      </div>

      <Alert>
        <Camera className="h-4 w-4" />
        <AlertDescription>
          <strong>Document Tips:</strong> Ensure all documents are clear, legible, and current. 
          You can use your phone to take photos of physical documents. All documents are securely 
          stored and encrypted. Make sure expiration dates are clearly visible.
        </AlertDescription>
      </Alert>

      <div className="flex justify-center gap-4 pt-6">
        <Button
          onClick={handleComplete}
          disabled={isUploading || isSaving}
          size="lg"
          className="min-w-48"
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : isSaving ? (
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

