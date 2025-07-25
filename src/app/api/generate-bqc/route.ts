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
    const { fileUrl, fileKey, fileName } = await request.json()

    if ((!fileUrl && !fileKey) || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields: fileUrl/fileKey, fileName' },
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
      JSON.stringify({ status: 'processing', message: 'Downloading and processing file...' }),
      3600 // 1 hour expiry
    )

    try {
      let fileBuffer: Buffer

      if (fileKey) {
        // Download file from R2 using file key
        const r2Client = getR2Client()
        fileBuffer = await r2Client.downloadFile(fileKey)
      } else if (fileUrl) {
        // Download file from R2 using public URL (fallback)
        const fileResponse = await fetch(fileUrl)
        if (!fileResponse.ok) {
          throw new Error('Failed to download file from storage')
        }
        fileBuffer = Buffer.from(await fileResponse.arrayBuffer())
      } else {
        throw new Error('No valid file reference provided')
      }

      // Load the BQC generation prompt
      const promptPath = path.join(process.cwd(), 'prompt.md')
      const promptTemplate = await fs.readFile(promptPath, 'utf-8')

      // Update status
      await RedisService.setGenerationStatus(
        topicId,
        JSON.stringify({ status: 'generating', message: 'Analyzing PDF with AI vision and generating BQC quiz content...' }),
        3600
      )

      // Use OpenAI vision to process the PDF directly
      const maxSizeMB = parseInt(process.env.MAX_PDF_SIZE_MB || '30')
      const processor = new PdfProcessor({ 
        maxFileSizeMB: maxSizeMB,
        timeoutMs: 60000 
      })

      const { textStream, result } = await processor.generateQuiz(
        fileBuffer,
        fileName,
        promptTemplate
      )

      // Estimate cost for monitoring
      const costEstimate = PdfProcessor.estimateCost(fileBuffer.length)

      // Log processing metadata for monitoring
      console.log('Processing metadata:', {
        topicId,
        fileName,
        method: 'openai-vision',
        processingTime: result.processingTime,
        costEstimate,
        fileSize: fileBuffer.length
      })

      // Set up response headers for streaming
      const encoder = new TextEncoder()
      let accumulatedText = ''

      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Send processing status
            const processingData = `data: ${JSON.stringify({
              type: 'processing',
              message: 'Starting AI analysis...',
              topicId
            })}\n\n`
            controller.enqueue(encoder.encode(processingData))

            let chunkCount = 0
            for await (const chunk of textStream) {
              accumulatedText += chunk
              chunkCount++
              
              // Send different events based on progress
              let eventType = 'generating'
              let message = 'Generating quiz content...'
              
              if (chunkCount <= 3) {
                eventType = 'analyzing'
                message = 'Analyzing document content...'
              } else if (chunkCount > 3 && chunkCount <= 10) {
                eventType = 'processing'
                message = 'Processing educational content...'
              }
              
              // Send chunk to client
              const data = `data: ${JSON.stringify({ 
                type: eventType,
                content: chunk,
                message,
                topicId,
                metadata: {
                  processingMethod: 'openai-vision',
                  costEstimate,
                  chunkCount
                }
              })}\n\n`
              controller.enqueue(encoder.encode(data))
            }

            // Send finalizing event
            const finalizingData = `data: ${JSON.stringify({
              type: 'finalizing',
              message: 'Finalizing quiz structure...',
              topicId
            })}\n\n`
            controller.enqueue(encoder.encode(finalizingData))

            // Process complete BQC content
            try {
              console.log('Generated BQC content for parsing:', {
                topicId,
                contentLength: accumulatedText.length,
                contentPreview: accumulatedText.substring(0, 500) + (accumulatedText.length > 500 ? '...' : ''),
                startsWithYaml: accumulatedText.trim().startsWith('---'),
                hasSlug: accumulatedText.includes('slug:'),
                hasTitle: accumulatedText.includes('title:'),
                hasDescription: accumulatedText.includes('description:')
              })
              
              // Check if content needs YAML frontmatter repair
              let contentToParse = accumulatedText
              const needsRepair = !accumulatedText.trim().startsWith('---') || 
                                !accumulatedText.includes('slug:') || 
                                !accumulatedText.includes('title:') || 
                                !accumulatedText.includes('description:')
              
              if (needsRepair) {
                console.log('BQC content needs frontmatter repair, applying fallback formatting...')
                
                // Extract title from content if possible
                const titleMatch = accumulatedText.match(/(?:title|Title):\s*"?([^"\n]+)"?/i) || 
                                 accumulatedText.match(/(?:topic|Topic):\s*([^\n]+)/i) ||
                                 accumulatedText.match(/(?:unit|Unit)\s*\d*:?\s*([^\n]+)/i) ||
                                 accumulatedText.match(/(?:quiz|Quiz):\s*([^\n]+)/i)
                
                const extractedTitle = titleMatch ? titleMatch[1].trim() : 
                                     fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
                                     "Educational Quiz"
                
                // Generate slug from title
                const slug = extractedTitle.toLowerCase()
                                         .replace(/[^a-z0-9\s-]/g, '')
                                         .replace(/\s+/g, '-')
                                         .substring(0, 50) || 'generated-quiz'
                
                // Create proper BQC frontmatter
                const frontmatter = `---
slug: ${slug}
title: "${extractedTitle}"
description: "Educational quiz generated from PDF content"
author: "AI Generated"
version: "1.0"
---

`
                
                // Clean the content and add proper frontmatter
                const cleanContent = accumulatedText
                  .replace(/^['"]?yaml\\n['"]?\s*\+?\s*/i, '') // Remove yaml\n prefix
                  .replace(/^---[\s\S]*?---\s*/m, '') // Remove any existing malformed frontmatter
                  .replace(/^\s*['"]\s*/, '') // Remove leading quotes
                  .replace(/\s*['"]\s*$/, '') // Remove trailing quotes
                  .replace(/\\n/g, '\n') // Convert literal \n to actual newlines
                  .replace(/\s*\+\s*$/gm, '') // Remove trailing + from concatenation
                  .trim()
                
                contentToParse = frontmatter + cleanContent
                console.log('Repaired BQC content preview:', {
                  frontmatterAdded: true,
                  repairedLength: contentToParse.length,
                  repairedPreview: contentToParse.substring(0, 300) + '...'
                })
              }
              
              const parsedBQC = parseBQC(contentToParse)
              
              // Save to Redis
              await RedisService.saveTopic(topicId, {
                bqcRaw: contentToParse, // Save the repaired content
                bqcJson: JSON.stringify(parsedBQC),
                metadata: JSON.stringify({
                  originalFileName: fileName,
                  fileSize: fileBuffer.length,
                  processingMethod: 'openai-vision',
                  processingTime: result.processingTime,
                  costEstimateUSD: costEstimate,
                  createdAt: new Date().toISOString(),
                  fileUrl: fileUrl || null,
                  fileKey: fileKey || null,
                  storageProvider: 'cloudflare-r2'
                }),
                regenerated: 0
              })

              // Update status to completed
              await RedisService.setGenerationStatus(
                topicId,
                JSON.stringify({ status: 'completed', message: 'BQC generation completed successfully' }),
                3600
              )

              // Send success message
              const successData = `data: ${JSON.stringify({ 
                type: 'success', 
                topicId,
                message: 'BQC generation completed successfully'
              })}\n\n`
              controller.enqueue(encoder.encode(successData))

            } catch (parseError) {
              console.error('BQC parsing error:', parseError)
              
              // Update status to failed
              await RedisService.setGenerationStatus(
                topicId,
                JSON.stringify({ 
                  status: 'failed', 
                  message: 'Generated content is not valid BQC format',
                  error: parseError instanceof Error ? parseError.message : 'Parse error'
                }),
                3600
              )

              // Send error message
              const errorData = `data: ${JSON.stringify({ 
                type: 'error', 
                topicId,
                message: 'Failed to generate valid BQC format',
                rawContent: accumulatedText
              })}\n\n`
              controller.enqueue(encoder.encode(errorData))
            }

            // Close the stream
            controller.close()

          } catch (streamError) {
            console.error('Streaming error:', streamError)
            
            // Update status to failed
            await RedisService.setGenerationStatus(
              topicId,
              JSON.stringify({ 
                status: 'failed', 
                message: 'AI generation failed',
                error: streamError instanceof Error ? streamError.message : 'Stream error'
              }),
              3600
            )

            const errorData = `data: ${JSON.stringify({ 
              type: 'error', 
              topicId,
              message: 'AI generation failed'
            })}\n\n`
            controller.enqueue(encoder.encode(errorData))
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
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
        { error: 'File processing failed', topicId },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Generate BQC error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const maxDuration = 60 // 1 minute for AI generation