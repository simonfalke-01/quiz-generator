import OpenAI from 'openai'

export interface ProcessingResult {
  success: boolean
  tokensUsed?: number
  processingTime: number
  error?: string
}

export interface ProcessingOptions {
  maxFileSizeMB?: number
  timeoutMs?: number
}

/**
 * Simple PDF processor using OpenAI's direct PDF processing capabilities
 * No local parsing - leverages GPT-4o's vision to understand documents
 */
export class PdfProcessor {
  private readonly DEFAULT_MAX_FILE_SIZE_MB = 30
  private readonly DEFAULT_TIMEOUT_MS = 60000

  constructor(private options: ProcessingOptions = {}) {}

  /**
   * Generate quiz from PDF using OpenAI's direct PDF processing
   */
  async generateQuiz(
    fileBuffer: Buffer,
    fileName: string,
    promptTemplate: string
  ): Promise<{ textStream: AsyncIterable<string>; result: ProcessingResult }> {
    const startTime = Date.now()
    const maxSizeBytes = (this.options.maxFileSizeMB || this.DEFAULT_MAX_FILE_SIZE_MB) * 1024 * 1024

    // Pre-flight checks
    if (fileBuffer.length > maxSizeBytes) {
      throw new Error(`File ${fileName} (${Math.round(fileBuffer.length / 1024 / 1024)}MB) exceeds size limit of ${this.options.maxFileSizeMB || this.DEFAULT_MAX_FILE_SIZE_MB}MB`)
    }

    try {
      const textStream = await this.processWithOpenAi(fileBuffer, fileName, promptTemplate)
      
      return {
        textStream,
        result: {
          success: true,
          processingTime: Date.now() - startTime,
        }
      }
    } catch (error) {
      console.error('OpenAI PDF processing failed:', error)
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async processWithOpenAi(fileBuffer: Buffer, fileName: string, promptTemplate: string): Promise<AsyncIterable<string>> {
    console.log(`Processing PDF with OpenAI Responses API (${Math.round(fileBuffer.length / 1024)}KB)`)

    // Create OpenAI client for direct API access
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    const base64Data = fileBuffer.toString('base64')

    const prompt = promptTemplate

    try {
      // Use OpenAI's Responses API with correct structure from official docs
      const stream = await openaiClient.responses.create({
        model: 'o4-mini',
        input: [
          {
            role: 'user',
            content: [
              {
                type: 'input_file',
                filename: fileName,
                file_data: `data:application/pdf;base64,${base64Data}`
              },
              {
                type: 'input_text',
                text: prompt
              }
            ]
          }
        ],
        stream: true
      })

      return this.streamResponsesAPI(stream, fileName)
    } catch (error) {
      console.error('OpenAI Responses API failed:', error)
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Stream OpenAI Responses API response
   */
  private async *streamResponsesAPI(response: AsyncIterable<unknown>, fileName: string): AsyncIterable<string> {
    let accumulatedContent = ''
    
    try {
      // Handle the streaming response from Responses API
      for await (const chunk of response) {
        // Type guard for chunk structure
        if (typeof chunk === 'object' && chunk !== null) {
          const chunkObj = chunk as Record<string, unknown>
          
          // Handle the actual streaming format: response.output_text.delta
          if (chunkObj.type === 'response.output_text.delta' && chunkObj.delta) {
            const delta = chunkObj.delta as string
            accumulatedContent += delta
            yield delta
          }
        }
      }

      // Post-process to ensure proper BQC format if needed
      const hasProperFormat = accumulatedContent.trim().startsWith('---') && 
                             accumulatedContent.includes('slug:') && 
                             accumulatedContent.includes('title:') && 
                             accumulatedContent.includes('description:')
      
      if (!hasProperFormat) {
        // Generate and yield the corrected format
        const correctedContent = this.ensureBQCFormat(accumulatedContent, fileName)
        const additionalContent = correctedContent.substring(accumulatedContent.length)
        if (additionalContent) {
          yield additionalContent
        }
      }
    } catch (error) {
      console.error('Error streaming Responses API:', error)
      // Fallback: ensure we have valid BQC format
      const fallbackContent = this.ensureBQCFormat(accumulatedContent || '', fileName)
      const chunks = fallbackContent.match(/.{1,50}/g) || [fallbackContent]
      for (const chunk of chunks) {
        yield chunk
        await new Promise(resolve => setTimeout(resolve, 10))
      }
    }
  }

  /**
   * Ensure the generated content has proper BQC frontmatter and format
   */
  private ensureBQCFormat(content: string, fileName: string): string {
    // Check if content already has proper frontmatter
    if (content.trim().startsWith('---') && content.includes('slug:') && content.includes('title:') && content.includes('description:')) {
      return content
    }

    // Extract title from content, filename, or generate one
    const titleMatch = content.match(/(?:title|Title):\s*"?([^"\n]+)"?/i) || 
                     content.match(/(?:topic|Topic):\s*([^\n]+)/i) ||
                     content.match(/(?:unit|Unit)\s*\d*:?\s*([^\n]+)/i)
    
    const title = titleMatch ? titleMatch[1].trim() : 
                 fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ||
                 "Educational Quiz"
    
    // Generate slug from title
    const slug = title.toLowerCase()
                     .replace(/[^a-z0-9\s-]/g, '')
                     .replace(/\s+/g, '-')
                     .substring(0, 50) || 'generated-quiz'

    // Create proper BQC frontmatter
    const frontmatter = `---
slug: ${slug}
title: "${title}"
description: "Educational quiz generated from PDF content"
author: "AI Generated"
version: "1.0"
---

`

    // Remove any existing malformed frontmatter and add proper one
    const cleanContent = content.replace(/^---[\s\S]*?---\s*/m, '').trim()
    
    return frontmatter + cleanContent
  }

  /**
   * Estimate cost based on file size (rough approximation)
   */
  static estimateCost(fileSizeBytes: number): number {
    // Very rough estimate: larger files = more tokens
    // This is just for user guidance, actual costs may vary significantly
    const fileSizeMB = fileSizeBytes / (1024 * 1024)
    
    // Base cost + size multiplier
    const estimatedTokens = 1000 + (fileSizeMB * 2000) // Very rough heuristic
    
    // GPT-4o pricing: $2.50 input + $10.00 output per 1M tokens
    // Assume 80% input, 20% output
    const inputCost = (estimatedTokens * 0.8 / 1_000_000) * 2.50
    const outputCost = (estimatedTokens * 0.2 / 1_000_000) * 10.00
    
    return inputCost + outputCost
  }
}