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
      setIsUploading(true)
      setUploadProgress(prev => ({ ...prev, [documentType]: 0 }))

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${documentType}.${fileExt}`
      const filePath = `documents/${userProfile.id}/${fileName}`

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
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file)

      clearInterval(progressInterval)
      setUploadProgress(prev => ({ ...prev, [documentType]: 100 }))

      if (uploadError) {
        throw uploadError
      }

      // Insert metadata into documents table
      const documentMetadata: import('@/types/supabase').Database['public']['Tables']['documents']['Insert'] = {
        user_id: userProfile.id,
        title: file.name,
        description: '', // or provide a description if available
        file_path: filePath,
        file_type: file.type,
        document_type: documentType,
        expiration_date: null, // or set if available
        is_verified: false,
      }
      const { error: insertError } = await supabase
        .from('documents')
        .insert([documentMetadata])
      if (insertError) {
        console.error('Failed to insert document metadata:', insertError)
        setErrors(prev => [...prev, `Failed to save document metadata for ${documentType}: ${insertError.message}`])
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath)

      // Update uploaded documents
      const newDocuments = {
        ...uploadedDocuments,
        [documentType]: {
          name: file.name,
          url: publicUrl,
          path: filePath,
          uploaded_at: new Date().toISOString(),
          size: file.size,
          type: file.type
        }
      }

      setUploadedDocuments(newDocuments)
      onComplete({ uploaded_documents: newDocuments })

      setTimeout(() => {
        setUploadProgress(prev => ({ ...prev, [documentType]: 0 }))
      }, 1000)

    } catch (error: any) {
      console.error('Upload error:', error)
      setErrors(prev => [...prev, `Failed to upload ${documentType}: ${error?.message}`])
    } finally {
      setIsUploading(false)
    }
  }

  const removeDocument = async (documentType: string) => {
    try {
      const document = uploadedDocuments[documentType]
      if (document?.path) {
        await supabase.storage
          .from('documents')
          .remove([document.path])
      }

      const newDocuments = { ...uploadedDocuments }
      delete newDocuments[documentType]

      setUploadedDocuments(newDocuments)
      onComplete({ uploaded_documents: newDocuments })
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
      maxSize: 10 * 1024 * 1024 // 10MB
    })

    const isUploaded = uploadedDocuments[document.id]
    const progress = uploadProgress[document.id] || 0

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
                Supported formats: PDF, JPEG, PNG (max 10MB)
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
        <h2 className="text-3xl font-bold">Document Upload</h2>
        <p className="text-gray-600">
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