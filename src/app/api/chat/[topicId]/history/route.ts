import { NextRequest, NextResponse } from 'next/server'
import { RedisService } from '@/lib/redis'

interface RouteParams {
  params: Promise<{
    topicId: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { topicId } = await params

    if (!topicId || typeof topicId !== 'string') {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // Check if topic exists
    const topicExists = await RedisService.isTopicIdTaken(topicId)
    if (!topicExists) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Get chat history from Redis
    const chatHistory = await RedisService.getChatHistory(topicId)
    
    // Parse and flatten the chat messages
    const messages: Array<{
      id: string
      role: 'user' | 'assistant'
      content: string
      timestamp: Date
    }> = []

    chatHistory.forEach((entry, entryIndex) => {
      try {
        const parsed = JSON.parse(entry)
        if (parsed.messages && Array.isArray(parsed.messages)) {
          parsed.messages.forEach((msg: { role?: string; content?: string }, msgIndex: number) => {
            if (msg.role && msg.content && (msg.role === 'user' || msg.role === 'assistant')) {
              messages.push({
                id: `${entryIndex}-${msgIndex}-${msg.role}`,
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
                timestamp: new Date(parsed.timestamp || Date.now())
              })
            }
          })
        }
      } catch (parseError) {
        console.error('Error parsing chat history entry:', parseError)
      }
    })

    // Sort messages by timestamp
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return NextResponse.json({
      messages,
      totalMessages: messages.length
    })

  } catch (error) {
    console.error('Chat history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { topicId } = await params

    if (!topicId || typeof topicId !== 'string') {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // Clear chat history from Redis
    await RedisService.clearChatHistory(topicId)
    
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Clear chat history API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}