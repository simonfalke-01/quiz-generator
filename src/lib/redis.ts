import { createClient, RedisClientType } from 'redis'

let redisClient: RedisClientType | null = null

// Create Redis client with proper error handling
function createRedisClient(): RedisClientType {
  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  const client = createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
    }
  })

  client.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  client.on('connect', () => {
    console.log('Connected to Redis')
  })

  client.on('ready', () => {
    console.log('Redis client ready')
  })

  client.on('end', () => {
    console.log('Redis connection ended')
  })

  return client as RedisClientType
}

// Initialize Redis connection
async function initializeRedis(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }

  try {
    redisClient = createRedisClient()
    await redisClient.connect()
    return redisClient
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    throw error
  }
}

// Get Redis client instance
export async function getRedisClient(): Promise<RedisClientType> {
  if (redisClient && redisClient.isOpen) {
    return redisClient
  }
  
  return await initializeRedis()
}

// Utility functions for common Redis operations
export class RedisService {
  private static async getClient(): Promise<RedisClientType> {
    return await getRedisClient()
  }

  // Topic operations
  static async saveTopic(topicId: string, data: {
    bqcRaw: string
    bqcJson: string
    metadata: string
    regenerated: number
  }): Promise<void> {
    const client = await this.getClient()
    
    await client.multi()
      .hSet(`topic:${topicId}`, data)
      .sAdd('topics:all', topicId)
      .exec()
  }

  static async getTopic(topicId: string): Promise<Record<string, string> | null> {
    const client = await this.getClient()
    const data = await client.hGetAll(`topic:${topicId}`)
    return Object.keys(data).length > 0 ? data : null
  }

  static async getAllTopicIds(): Promise<string[]> {
    const client = await this.getClient()
    return await client.sMembers('topics:all')
  }

  static async deleteTopic(topicId: string): Promise<void> {
    const client = await this.getClient()
    
    await client.multi()
      .del(`topic:${topicId}`)
      .sRem('topics:all', topicId)
      .del(`generation:${topicId}`)
      .del(`chat:${topicId}`)
      .exec()
  }

  // Generation status operations
  static async setGenerationStatus(topicId: string, status: string, expiry?: number): Promise<void> {
    const client = await this.getClient()
    if (expiry) {
      await client.setEx(`generation:${topicId}`, expiry, status)
    } else {
      await client.set(`generation:${topicId}`, status)
    }
  }

  static async getGenerationStatus(topicId: string): Promise<string | null> {
    const client = await this.getClient()
    return await client.get(`generation:${topicId}`)
  }

  // Chat history operations
  static async addChatMessage(topicId: string, message: string): Promise<void> {
    const client = await this.getClient()
    await client.rPush(`chat:${topicId}`, message)
  }

  static async getChatHistory(topicId: string): Promise<string[]> {
    const client = await this.getClient()
    return await client.lRange(`chat:${topicId}`, 0, -1)
  }

  static async clearChatHistory(topicId: string): Promise<void> {
    const client = await this.getClient()
    await client.del(`chat:${topicId}`)
  }

  // Topic code collision checking
  static async isTopicIdTaken(topicId: string): Promise<boolean> {
    const client = await this.getClient()
    return Boolean(await client.sIsMember('topics:all', topicId))
  }
}

export default redisClient