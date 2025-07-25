import { NextRequest, NextResponse } from 'next/server'
import { RedisService } from '@/lib/redis'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid topic ID' },
        { status: 400 }
      )
    }

    // Clean and validate topic code format
    const topicId = id.trim().toUpperCase()
    
    if (topicId.length < 6 || topicId.length > 10) {
      return NextResponse.json(
        { error: 'Invalid topic code format' },
        { status: 400 }
      )
    }

    try {
      // Check if topic exists in Redis
      const topicExists = await RedisService.isTopicIdTaken(topicId)
      
      if (topicExists) {
        return NextResponse.json({
          valid: true,
          topicId
        })
      } else {
        return NextResponse.json(
          { error: 'Topic not found' },
          { status: 404 }
        )
      }
    } catch (redisError) {
      console.error('Redis error during topic validation:', redisError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Topic validation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}