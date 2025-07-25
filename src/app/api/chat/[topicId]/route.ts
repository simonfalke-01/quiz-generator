import { NextRequest, NextResponse } from 'next/server'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { RedisService } from '@/lib/redis'

interface RouteParams {
  params: Promise<{
    topicId: string
  }>
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { topicId } = await params
    const { message, history } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      )
    }

    // Get topic data from Redis
    const topicData = await RedisService.getTopic(topicId)
    if (!topicData) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Use the BQC content as source material for chat context
    // Since we're using OpenAI vision processing, the BQC already contains
    // the analyzed content from the original PDF
    const sourceMaterial = topicData.bqcRaw || ''

    // Build conversation history
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
    
    if (Array.isArray(history)) {
      history.forEach((msg: ChatMessage) => {
        if (msg.role && msg.content) {
          conversationHistory.push({
            role: msg.role,
            content: msg.content
          })
        }
      })
    }

    // Add the current user message
    conversationHistory.push({
      role: 'user',
      content: message
    })

    // Create the system prompt with source material context
    const systemPrompt = `You are an AI tutor helping a student understand study material. You have access to the following source material:

<SOURCE_MATERIAL>
${sourceMaterial}
</SOURCE_MATERIAL>

Guidelines:
- Answer questions based on the provided source material
- If a question is outside the scope of the material, politely redirect to the content
- Provide clear, educational explanations
- Use examples from the source material when helpful
- Be encouraging and supportive
- If asked about quiz questions, you can help explain concepts but don't give direct answers

FORMATTING INSTRUCTIONS:
Your responses will be rendered with markdown support. Please use these formatting options to enhance readability:

- **Bold text** for important terms and concepts
- *Italic text* for emphasis
- • Bullet points for lists
- 1. Numbered lists for sequences or steps
- Mathematical expressions using LaTeX: $H_2O$ for subscripts, $x^2$ for superscripts
- For complex equations, use display math: $$equation$$

Examples:
- Chemical formulas: $C_6H_{12}O_6$, $CO_2$, $H_2O$
- Important concept: **Cellular respiration** is the process...
- Process steps: 1. First step 2. Second step
- Emphasis: The *most important* factor is...

Always format chemical formulas and equations using LaTeX math notation for proper subscripts and superscripts.

The student is asking questions about this material to better understand it. Please provide helpful, accurate responses based on the content provided.`

    // Create the messages array for the AI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory
    ]

    // Stream the AI response
    const result = await streamText({
      model: openai('gpt-4-turbo'), // Using GPT-4 for better conversation quality
      messages,
      temperature: 0.7,
      maxTokens: 1000
    })

    // Set up streaming response
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            const data = `data: ${JSON.stringify({
              content: chunk
            })}\n\n`
            controller.enqueue(encoder.encode(data))
          }

          // Send completion signal
          const endData = `data: ${JSON.stringify({
            type: 'complete'
          })}\n\n`
          controller.enqueue(encoder.encode(endData))
          
          controller.close()

          // Save chat message to Redis (fire and forget)
          try {
            const fullResponse = await result.text
            await RedisService.addChatMessage(
              topicId,
              JSON.stringify({
                timestamp: new Date().toISOString(),
                messages: [
                  { role: 'user', content: message },
                  { role: 'assistant', content: fullResponse }
                ]
              })
            )
          } catch (saveError) {
            console.error('Failed to save chat message to Redis:', saveError)
          }

        } catch (streamError) {
          console.error('Streaming error:', streamError)
          const errorData = `data: ${JSON.stringify({
            type: 'error',
            message: 'AI response failed'
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

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'nodejs'
export const maxDuration = 30