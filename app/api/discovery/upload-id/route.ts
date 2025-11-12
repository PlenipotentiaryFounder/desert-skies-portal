import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { completeIDUpload } from '@/lib/discovery-flight-service'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const discoveryFlightId = formData.get('discovery_flight_id') as string

    if (!file || !discoveryFlightId) {
      return NextResponse.json({ error: 'Missing file or discovery flight ID' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const supabase = await createClient()

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${discoveryFlightId}-${Date.now()}.${fileExt}`
    const filePath = `discovery-flights/${discoveryFlightId}/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    if (!uploadData?.path) {
      throw new Error('Upload succeeded but no file path returned')
    }

    // Determine document type from filename or default to drivers_license
    const documentType = 'drivers_license' // Could be enhanced to detect type

    // Update discovery flight record
    const discoveryFlight = await completeIDUpload(discoveryFlightId, uploadData.path, documentType)

    return NextResponse.json({ 
      discovery_flight: discoveryFlight,
      file_path: uploadData.path,
    }, { status: 200 })
  } catch (error) {
    console.error('Error uploading ID:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}


