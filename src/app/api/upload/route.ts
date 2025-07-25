import { NextRequest, NextResponse } from 'next/server'
import { getR2Client } from '@/lib/r2-client'
import { FileValidator } from '@/lib/file-validation'

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate the file
    const validation = FileValidator.validateFile(file)
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
      const fileKey = r2Client.generateFileKey(file.name)

      // Convert file to buffer
      const fileBuffer = Buffer.from(await file.arrayBuffer())

      // Upload to Cloudflare R2
      const uploadResult = await r2Client.uploadFile({
        key: fileKey,
        body: fileBuffer,
        contentType: file.type || FileValidator.getFileType(file.name),
        metadata: {
          originalName: file.name,
          uploadedBy: 'bio-revision-app',
          uploadedAt: new Date().toISOString()
        }
      })

      // Return the upload information
      return NextResponse.json({
        success: true,
        file: {
          key: uploadResult.key,
          url: uploadResult.url,
          size: uploadResult.size,
          contentType: uploadResult.contentType,
          uploadedAt: uploadResult.uploadedAt
        },
        fileName: file.name,
        fileSize: file.size,
        fileType: FileValidator.getFileType(file.name, file.type)
      })

    } catch (r2Error) {
      console.error('R2 upload error:', r2Error)
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Configure the API route for file uploads
export const runtime = 'nodejs'
export const maxDuration = 30 // 30 seconds for file processing