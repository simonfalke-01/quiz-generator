import { NextRequest, NextResponse } from 'next/server'
import { getR2Client } from '@/lib/r2-client'
import { FileValidator } from '@/lib/file-validation'

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileSize, contentType } = await request.json()

    // Validate input
    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json(
        { error: 'Invalid fileName' },
        { status: 400 }
      )
    }

    if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
      return NextResponse.json(
        { error: 'Invalid fileSize' },
        { status: 400 }
      )
    }

    // Create a mock file object for validation
    const mockFile = {
      name: fileName,
      size: fileSize,
      type: contentType || ''
    } as File

    // Validate file using our FileProcessor
    const validation = FileValidator.validateFile(mockFile)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Check if R2 is configured
    const { R2Client } = await import('@/lib/r2-client')
    const configValidation = R2Client.validateConfig()
    if (!configValidation.valid) {
      console.error('R2 configuration errors:', configValidation.errors)
      return NextResponse.json(
        { error: 'File upload service not configured' },
        { status: 500 }
      )
    }

    try {
      // Get R2 client instance
      const r2Client = getR2Client()

      // Generate unique file key
      const fileKey = r2Client.generateFileKey(fileName)

      // Generate pre-signed URL for direct client upload
      const uploadUrl = await r2Client.generateUploadUrl(
        fileKey,
        contentType || FileValidator.getFileType(fileName),
        3600 // 1 hour expiry
      )

      // Return pre-signed URL information
      return NextResponse.json({
        uploadUrl,
        fileKey,
        publicUrl: r2Client.getPublicUrl(fileKey),
        maxSize: 10 * 1024 * 1024, // 10MB
        acceptedTypes: ['application/pdf', 'text/plain', 'text/markdown'],
        expiresIn: 3600, // 1 hour
        uploadMethod: 'PUT' // R2 pre-signed URLs use PUT method
      })

    } catch (r2Error) {
      console.error('R2 pre-signed URL error:', r2Error)
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}