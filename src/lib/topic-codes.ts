import { customAlphabet } from 'nanoid'
import { RedisService } from './redis'

export interface TopicCodeOptions {
  length?: number
  alphabet?: string
  maxRetries?: number
}

export class TopicCodeGenerator {
  private static readonly DEFAULT_LENGTH = 8
  private static readonly DEFAULT_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
  private static readonly DEFAULT_MAX_RETRIES = 5

  /**
   * Generate a unique topic code that doesn't exist in Redis
   */
  static async generateUniqueTopicCode(options: TopicCodeOptions = {}): Promise<string> {
    const {
      length = this.DEFAULT_LENGTH,
      alphabet = this.DEFAULT_ALPHABET,
      maxRetries = this.DEFAULT_MAX_RETRIES
    } = options

    const generateCode = customAlphabet(alphabet, length)
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const topicCode = generateCode()
      
      try {
        const isExisting = await RedisService.isTopicIdTaken(topicCode)
        
        if (!isExisting) {
          return topicCode
        }
        
        console.log(`Topic code collision detected: ${topicCode}, retrying... (attempt ${attempt + 1}/${maxRetries})`)
      } catch (error) {
        console.error('Error checking topic code collision:', error)
        // On Redis error, continue with generation but log the issue
        if (attempt === maxRetries - 1) {
          throw new Error('Failed to generate unique topic code due to database error')
        }
      }
    }

    throw new Error(`Failed to generate unique topic code after ${maxRetries} attempts`)
  }

  /**
   * Generate a topic code with custom alphabet (removes confusing characters)
   */
  static async generateReadableTopicCode(): Promise<string> {
    // Remove confusing characters: 0, O, I, L, 1
    const readableAlphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
    
    return await this.generateUniqueTopicCode({
      length: 8,
      alphabet: readableAlphabet
    })
  }

  /**
   * Generate a short topic code for easy sharing (6 characters)
   */
  static async generateShortTopicCode(): Promise<string> {
    const readableAlphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
    
    return await this.generateUniqueTopicCode({
      length: 6,
      alphabet: readableAlphabet
    })
  }

  /**
   * Validate topic code format
   */
  static isValidTopicCode(code: string): boolean {
    if (!code || typeof code !== 'string') {
      return false
    }

    // Check length (should be between 6-10 characters)
    if (code.length < 6 || code.length > 10) {
      return false
    }

    // Check if contains only allowed characters
    const allowedChars = /^[a-zA-Z0-9]+$/
    if (!allowedChars.test(code)) {
      return false
    }

    return true
  }

  /**
   * Check if topic code exists in the system
   */
  static async isTopicCodeExists(code: string): Promise<boolean> {
    if (!this.isValidTopicCode(code)) {
      return false
    }

    try {
      return await RedisService.isTopicIdTaken(code)
    } catch (error) {
      console.error('Error checking topic code existence:', error)
      throw new Error('Failed to verify topic code')
    }
  }

  /**
   * Format topic code for display (adds dashes for readability)
   */
  static formatTopicCodeForDisplay(code: string): string {
    if (code.length <= 4) {
      return code
    }

    // Insert dash every 4 characters for readability
    return code.replace(/(.{4})/g, '$1-').replace(/-$/, '')
  }

  /**
   * Remove formatting from topic code
   */
  static cleanTopicCode(code: string): string {
    return code.replace(/[-\s]/g, '').toUpperCase()
  }
}

// Utility functions for backward compatibility
export const generateUniqueTopicCode = TopicCodeGenerator.generateUniqueTopicCode
export const generateReadableTopicCode = TopicCodeGenerator.generateReadableTopicCode
export const isValidTopicCode = TopicCodeGenerator.isValidTopicCode
export const isTopicCodeExists = TopicCodeGenerator.isTopicCodeExists