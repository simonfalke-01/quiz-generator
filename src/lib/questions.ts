import { Topic } from './types'
import { RedisService } from './redis'

/**
 * Get all available topic IDs from Redis
 */
export async function getAllTopicIds(): Promise<string[]> {
  try {
    return await RedisService.getAllTopicIds()
  } catch (error) {
    console.error('Error reading topic IDs from Redis:', error)
    return []
  }
}

/**
 * Get topic data by ID from Redis
 */
export async function getTopicById(topicId: string): Promise<Topic | null> {
  try {
    const topicData = await RedisService.getTopic(topicId)
    
    if (!topicData || !topicData.bqcJson) {
      return null
    }

    // Parse the stored JSON data
    const parsedTopic = JSON.parse(topicData.bqcJson) as Topic
    return parsedTopic
  } catch (error) {
    console.error(`Error loading topic ${topicId}:`, error)
    return null
  }
}

/**
 * Get topic data with metadata by ID from Redis
 */
export async function getTopicWithMetadata(topicId: string): Promise<{
  topic: Topic
  metadata: Record<string, unknown>
  bqcRaw: string
  regenerated: number
} | null> {
  try {
    const topicData = await RedisService.getTopic(topicId)
    
    if (!topicData || !topicData.bqcJson) {
      return null
    }

    const topic = JSON.parse(topicData.bqcJson) as Topic
    const metadata = topicData.metadata ? JSON.parse(topicData.metadata) : {}

    return {
      topic,
      metadata,
      bqcRaw: topicData.bqcRaw || '',
      regenerated: parseInt(topicData.regenerated || '0', 10)
    }
  } catch (error) {
    console.error(`Error loading topic with metadata ${topicId}:`, error)
    return null
  }
}

/**
 * Get all topics with basic metadata from Redis
 */
export async function getAllTopics(): Promise<Array<{
  id: string
  slug: string
  title: string
  description: string
  createdAt?: string
}>> {
  const topicIds = await getAllTopicIds()
  const topics = []
  
  for (const topicId of topicIds) {
    const topicWithMeta = await getTopicWithMetadata(topicId)
    if (topicWithMeta) {
      topics.push({
        id: topicId,
        slug: topicId, // For backward compatibility
        title: topicWithMeta.topic.title,
        description: topicWithMeta.topic.description,
        createdAt: topicWithMeta.metadata.createdAt as string
      })
    }
  }
  
  // Sort by creation date, newest first
  return topics.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

/**
 * Get statistics for a topic
 */
export function getTopicStats(topic: Topic) {
  const totalSections = topic.sections.length
  const totalQuestions = topic.sections.reduce((sum, section) => sum + section.questions.length, 0)
  const totalBlanks = topic.sections.reduce((sum, section) => {
    return sum + section.questions.reduce((questionSum, question) => {
      return questionSum + question.content.filter(content => content.type === 'blank').length
    }, 0)
  }, 0)
  
  return {
    totalSections,
    totalQuestions,
    totalBlanks
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getTopicById instead
 */
export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  return await getTopicById(slug)
}

/**
 * Legacy function for backward compatibility  
 * @deprecated Use getAllTopicIds instead
 */
export async function getAllTopicSlugs(): Promise<string[]> {
  return await getAllTopicIds()
}