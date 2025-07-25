import { NextRequest, NextResponse } from 'next/server'
import { RedisService } from '@/lib/redis'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: topicId } = await params

    if (!topicId) {
      return NextResponse.json({ error: 'Topic ID is required' }, { status: 400 })
    }

    // Get generation status from Redis
    const statusData = await RedisService.getGenerationStatus(topicId)
    
    if (!statusData) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
    }

    // Parse the status data
    const status = JSON.parse(statusData)
    
    return NextResponse.json(status)

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}