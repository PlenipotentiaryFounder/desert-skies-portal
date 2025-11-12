'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  Download
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

const REQUIRED_DOCUMENTS = [
  {
    id: 'government_id',
    name: 'Government Issued ID',
    description: 'Driver\'s license, passport, or state ID',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  },
  {
    id: 'pilot_certificate',
    name: 'Pilot Certificate',
    description: 'Current pilot certificate (if applicable)',
    required: false,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  },
  {
    id: 'medical_certificate',
    name: 'Medical Certificate',
    description: 'Current medical certificate (if applicable)',
    required: false,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
  },
  {
    id: 'birth_certificate',
    name: 'Birth Certificate or Passport',
    description: 'Proof of citizenship or eligibility',
    required: true,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
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

      // Check file size (4MB limit to match storage bucket)
      if (file.size > 4 * 1024 * 1024) {
        throw new Error('File size must be less than 4MB')
      }

      // Validate file type
      const documentConfig = REQUIRED_DOCUMENTS.find(doc => doc.id === documentType)
      if (!documentConfig?.acceptedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not accepted for ${documentType}`)
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${documentType}.${fileExt}`
      // Fix file path to match storage policy: folder name should be user ID
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

      // Upload to Supabase Storage
      console.log('Attempting upload:', {
        filePath,
        fileSize: file.size,
        fileType: file.type,
        fileName: file.name,
        userId: userProfile.id
      })
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      clearInterval(progressInterval)
      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }))

      console.log('Upload response:', { uploadError, uploadData })
      
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
        description: `Uploaded during onboarding for ${documentType}`,
        file_path: uploadData.path,
        file_type: file.type,
        document_type: documentType,
        expiration_date: null,
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

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(uploadData.path)

      // Update uploaded documents
      const newDocuments = {
        ...uploadedDocuments,
        [documentType]: {
          name: file.name,
          url: publicUrl,
          path: uploadData.path,
          uploaded_at: new Date().toISOString(),
          size: file.size,
          type: file.type
        }
      }

      setUploadedDocuments(newDocuments)
      // Don't auto-progress, let user click "Save and Continue"

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
          // Continue with removing from UI even if storage removal fails
        }
      }

      const newDocuments = { ...uploadedDocuments }
      delete newDocuments[documentType]

      setUploadedDocuments(newDocuments)
      // Don't auto-progress, let user click "Save and Continue"
    } catch (error) {
      console.error('Remove error:', error)
    }
  }

  const validateDocuments = () => {
    const newErrors: string[] = []
    
    const requiredDocs = REQUIRED_DOCUMENTS.filter(doc => doc.required)
    for (const doc of requiredDocs) {
      if (!uploadedDocuments[doc.id]) {
        newErrors.push(`${doc.name} is required`)
      }
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleComplete = () => {
    if (validateDocuments()) {
      onComplete({ uploaded_documents: uploadedDocuments })
    }
  }

  const handleSkip = () => {
    onSkip()
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
      maxSize: 4 * 1024 * 1024, // 4MB to match storage bucket limit
      // Add defensive options to prevent MutationObserver errors
      preventDropOnDocument: true,
      noClick: false,
      noKeyboard: false,
      // Disable drag and drop if we're in a problematic state
      disabled: isUploading
    })

    const isUploaded = uploadedDocuments[document.id]
    const progress = uploadProgress[document.id] || 0

    // Add error boundary for dropzone
    let rootProps, inputProps;
    try {
      rootProps = getRootProps();
      inputProps = getInputProps();
    } catch (error) {
      console.warn('Dropzone initialization error:', error);
      // Fallback to basic file input if dropzone fails
      rootProps = {};
      inputProps = {
        type: 'file',
        accept: document.acceptedTypes.join(','),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (file) uploadDocument(file, document.id);
        }
      };
    }

    return (
      <Card className="relative">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>{document.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {document.required && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
              {isUploaded && (
                <Badge variant="success" className="text-xs">Uploaded</Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">{document.description}</p>
          
          {!isUploaded ? (
            <div
              {...rootProps}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...inputProps} />
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-700">
                {isDragActive 
                  ? 'Drop the file here...' 
                  : 'Drag & drop a file here, or click to select'
                }
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Supported formats: PDF, JPEG, PNG (max 4MB)
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{uploadedDocuments[document.id].name}</p>
                  <p className="text-xs text-gray-500">
                    Uploaded {new Date(uploadedDocuments[document.id].uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(document.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
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
    const total = REQUIRED_DOCUMENTS.length
    const uploaded = Object.keys(uploadedDocuments).length
    return Math.round((uploaded / total) * 100)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Upload className="w-12 h-12 text-blue-600 mx-auto" />
        <h2 className="text-3xl font-bold text-gray-900">Document Upload</h2>
        <p className="text-gray-700">
          Upload your required documents to complete your student record
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Upload Progress</span>
            <Badge variant="outline">
              {Object.keys(uploadedDocuments).length} of {REQUIRED_DOCUMENTS.length} documents
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={getUploadProgress()} className="h-2" />
          <p className="text-sm text-gray-700 mt-2">
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
        {REQUIRED_DOCUMENTS.map((document) => (
          <DocumentUploadCard key={document.id} document={document} />
        ))}
      </div>

      <Alert>
        <Camera className="h-4 w-4" />
        <AlertDescription>
          <strong>Document Tips:</strong> Ensure documents are clear and legible. 
          You can use your phone to take photos of physical documents. All documents 
          are securely stored and encrypted.
        </AlertDescription>
      </Alert>

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={handleSkip}
          disabled={isUploading}
          size="lg"
        >
          Skip for Now
        </Button>
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