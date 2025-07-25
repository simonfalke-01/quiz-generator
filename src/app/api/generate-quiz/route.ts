import { NextRequest, NextResponse } from 'next/server'
import { TopicCodeGenerator } from '@/lib/topic-codes'
import { RedisService } from '@/lib/redis'
import { getR2Client } from '@/lib/r2-client'
import { parseBQC } from '@/lib/bqc-parser'
import { PdfProcessor } from '@/lib/pdf-processor'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // Extract files and question count
    const files = formData.getAll('files') as File[]
    const questionCount = parseInt(formData.get('questionCount') as string) || 100

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      )
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 files allowed' },
        { status: 400 }
      )
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // Generate unique topic ID
    const topicId = await TopicCodeGenerator.generateReadableTopicCode()

    // Set initial generation status
    await RedisService.setGenerationStatus(
      topicId, 
      JSON.stringify({ status: 'processing', message: 'Processing files...' }),
      3600 // 1 hour expiry
    )

    try {
      // Upload files to R2 storage and validate
      const r2Client = getR2Client()
      const uploadedFiles = []

      for (const file of files) {
        // Validate file size (30MB limit)
        if (file.size > 30 * 1024 * 1024) {
          throw new Error(`File ${file.name} exceeds 30MB limit`)
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
        const allowedExtensions = ['.pdf', '.txt', '.md']
        const fileExtension = '.' + file.name.toLowerCase().split('.').pop()
        
        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
          throw new Error(`File ${file.name} has unsupported format. Only PDF, TXT, and MD files are allowed.`)
        }

        // Upload to R2
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        const fileKey = r2Client.generateFileKey(file.name, 'quiz-uploads')
        
        const uploadResult = await r2Client.uploadFile({
          key: fileKey,
          body: fileBuffer,
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            topicId: topicId
          }
        })
        
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          key: uploadResult.key,
          buffer: fileBuffer
        })
      }

      // Return topic ID immediately and start background processing
      // Don't wait for AI processing - let the client poll for status
      
      // Start background processing (don't await)
      processFilesInBackground(topicId, uploadedFiles, questionCount).catch(error => {
        console.error('Background processing error:', error)
        RedisService.setGenerationStatus(
          topicId,
          JSON.stringify({ 
            status: 'failed', 
            message: 'Processing failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }),
          3600
        )
      })

      return NextResponse.json({ 
        topicId,
        message: 'Files uploaded successfully, generation started'
      })

    } catch (processingError) {
      console.error('File processing error:', processingError)
      
      await RedisService.setGenerationStatus(
        topicId,
        JSON.stringify({ 
          status: 'failed', 
          message: 'File processing failed',
          error: processingError instanceof Error ? processingError.message : 'Processing error'
        }),
        3600
      )

      return NextResponse.json(
        { error: processingError instanceof Error ? processingError.message : 'File processing failed', topicId },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Generate quiz error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Background processing function using working PdfProcessor
async function processFilesInBackground(
  topicId: string, 
  uploadedFiles: Array<{
    name: string
    size: number
    type: string
    key: string
    buffer: Buffer
  }>, 
  questionCount: number
) {
  try {
    // Update status to generating
    await RedisService.setGenerationStatus(
      topicId,
      JSON.stringify({ status: 'generating', message: 'Processing documents with AI...' }),
      3600
    )

    // Load and customize the BQC generation prompt
    const promptPath = path.join(process.cwd(), 'prompt.md')
    let promptTemplate = await fs.readFile(promptPath, 'utf-8')
    
    // Replace question count placeholder
    promptTemplate = promptTemplate.replace(/\{\{QUESTION_COUNT\}\}/g, questionCount.toString())
    
    // Add multi-file context if needed
    if (uploadedFiles.length > 1) {
      const fileList = uploadedFiles.map(f => f.name).join(', ')
      promptTemplate = `You are processing ${uploadedFiles.length} files: ${fileList}. Combine information from all files to create ${questionCount} comprehensive questions.\n\n` + promptTemplate
    }

    // Initialize PdfProcessor with default options
    const processor = new PdfProcessor({ maxFileSizeMB: 30, timeoutMs: 120000 })

    let allGeneratedContent = ''
    let hasProcessedFirstFile = false

    // Process each file using the working PdfProcessor
    for (const file of uploadedFiles) {
      console.log(`Processing file: ${file.name} (${Math.round(file.size / 1024)}KB)`)
      
      try {
        const { textStream } = await processor.generateQuiz(
          file.buffer,
          file.name,
          promptTemplate
        )

        // Collect streamed content
        let fileContent = ''
        for await (const chunk of textStream) {
          fileContent += chunk
        }

        // For multi-file processing, combine content appropriately
        if (hasProcessedFirstFile) {
          // Extract just the question content (skip frontmatter for subsequent files)
          const contentWithoutFrontmatter = fileContent.replace(/^---[\s\S]*?---\s*/m, '').trim()
          allGeneratedContent += '\n\n' + contentWithoutFrontmatter
        } else {
          allGeneratedContent = fileContent
          hasProcessedFirstFile = true
        }

        console.log(`Completed processing: ${file.name}`)
      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError)
        throw new Error(`Failed to process file ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`)
      }
    }

    // Calculate total cost estimate (rough estimate)
    const totalSize = uploadedFiles.reduce((sum, file) => sum + file.size, 0)
    const costEstimate = PdfProcessor.estimateCost(totalSize)

    // Log processing metadata
    console.log('Processing metadata:', {
      topicId,
      fileNames: uploadedFiles.map(f => f.name),
      fileCount: uploadedFiles.length,
      questionCount,
      method: 'openai-responses-api',
      costEstimate,
      totalFileSize: totalSize
    })

    // Process and validate BQC content
    try {
      const parsedBQC = parseBQC(allGeneratedContent)
      
      // Save to Redis
      await RedisService.saveTopic(topicId, {
        bqcRaw: allGeneratedContent,
        bqcJson: JSON.stringify(parsedBQC),
        metadata: JSON.stringify({
          originalFileNames: uploadedFiles.map(f => f.name),
          fileCount: uploadedFiles.length,
          questionCount,
          totalFileSize: totalSize,
          processingMethod: 'openai-responses-api',
          costEstimateUSD: costEstimate,
          createdAt: new Date().toISOString(),
          fileKeys: uploadedFiles.map(f => f.key),
          storageProvider: 'cloudflare-r2'
        }),
        regenerated: 0
      })

      // Update status to completed
      await RedisService.setGenerationStatus(
        topicId,
        JSON.stringify({ status: 'completed', message: 'Quiz generation completed successfully' }),
        3600
      )

    } catch (parseError) {
      console.error('BQC parsing error:', parseError)
      
      await RedisService.setGenerationStatus(
        topicId,
        JSON.stringify({ 
          status: 'failed', 
          message: 'Generated content is not valid BQC format',
          error: parseError instanceof Error ? parseError.message : 'Parse error'
        }),
        3600
      )
    }

  } catch (processingError) {
    console.error('Background processing error:', processingError)
    
    await RedisService.setGenerationStatus(
      topicId,
      JSON.stringify({ 
        status: 'failed', 
        message: 'AI generation failed',
        error: processingError instanceof Error ? processingError.message : 'Processing error'
      }),
      3600
    )
  }
}

export const runtime = 'nodejs'
export const maxDuration = 60