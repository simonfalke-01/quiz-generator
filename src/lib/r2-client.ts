import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrl?: string
}

interface UploadOptions {
  key: string
  body: Buffer | Uint8Array
  contentType?: string
  metadata?: Record<string, string>
}

interface UploadResult {
  key: string
  url: string
  size: number
  contentType?: string
  uploadedAt: Date
}

export class R2Client {
  private s3Client: S3Client
  private config: R2Config

  constructor() {
    // Validate required environment variables
    const requiredVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME']
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`)
      }
    }

    this.config = {
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: process.env.R2_BUCKET_NAME!,
      publicUrl: process.env.R2_PUBLIC_URL
    }

    // Create S3 client configured for Cloudflare R2
    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' as the region
      endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey
      },
      forcePathStyle: true // Use path-style for R2 compatibility
    })
  }

  /**
   * Upload a file to R2
   */
  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
        Metadata: options.metadata
      })

      await this.s3Client.send(command)

      const size = options.body.byteLength
      const url = this.getPublicUrl(options.key)

      return {
        key: options.key,
        url,
        size,
        contentType: options.contentType,
        uploadedAt: new Date()
      }
    } catch (error) {
      console.error('R2 upload error:', error)
      throw new Error(`Failed to upload file to R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download a file from R2
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key
      })

      const response = await this.s3Client.send(command)
      
      if (!response.Body) {
        throw new Error('No file content received')
      }

      // Convert the stream to a buffer
      const chunks: Uint8Array[] = []
      const reader = response.Body.transformToWebStream().getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      return Buffer.concat(chunks)
    } catch (error) {
      console.error('R2 download error:', error)
      throw new Error(`Failed to download file from R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from R2
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key
      })

      await this.s3Client.send(command)
    } catch (error) {
      console.error('R2 delete error:', error)
      throw new Error(`Failed to delete file from R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a pre-signed URL for direct client uploads
   */
  async generateUploadUrl(key: string, contentType?: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        ContentType: contentType
      })

      return await getSignedUrl(this.s3Client, command, { expiresIn })
    } catch (error) {
      console.error('R2 pre-signed URL error:', error)
      throw new Error(`Failed to generate upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a pre-signed URL for file downloads (private files)
   */
  async generateDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucketName,
        Key: key
      })

      return await getSignedUrl(this.s3Client, command, { expiresIn })
    } catch (error) {
      console.error('R2 download URL error:', error)
      throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get public URL for a file (if bucket allows public access)
   */
  getPublicUrl(key: string): string {
    if (this.config.publicUrl) {
      // Use custom domain if configured
      return `${this.config.publicUrl}/${key}`
    }
    
    // Use default R2 public URL format
    return `https://${this.config.bucketName}.${this.config.accountId}.r2.cloudflarestorage.com/${key}`
  }

  /**
   * Generate a unique file key with timestamp and random suffix
   */
  generateFileKey(originalFileName: string, prefix: string = 'uploads'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    const extension = originalFileName.split('.').pop()
    
    return `${prefix}/${timestamp}-${random}.${extension}`
  }

  /**
   * Validate R2 configuration
   */
  static validateConfig(): { valid: boolean; errors: string[] } {
    const requiredVars = [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID', 
      'R2_SECRET_ACCESS_KEY',
      'R2_BUCKET_NAME'
    ]

    const errors: string[] = []

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        errors.push(`Missing required environment variable: ${varName}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}

// Export a singleton instance
let r2Client: R2Client | null = null

export function getR2Client(): R2Client {
  if (!r2Client) {
    r2Client = new R2Client()
  }
  return r2Client
}

export default getR2Client