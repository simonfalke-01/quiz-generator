import { Topic } from './types'
import { parseBQC } from './bqc-parser'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Get all available topic slugs for static generation
 */
export async function getAllTopicSlugs(): Promise<string[]> {
  try {
    const dataDirectory = path.join(process.cwd(), 'data')
    const files = await fs.readdir(dataDirectory)
    
    return files
      .filter(file => file.endsWith('.bqc'))
      .map(file => file.replace('.bqc', ''))
  } catch (error) {
    console.error('Error reading topic slugs:', error)
    return []
  }
}

/**
 * Get topic data by slug
 */
export async function getTopicBySlug(slug: string): Promise<Topic | null> {
  try {
    const filePath = path.join(process.cwd(), 'data', `${slug}.bqc`)
    const fileContents = await fs.readFile(filePath, 'utf8')
    const topicData = parseBQC(fileContents)
    
    return topicData
  } catch (error) {
    console.error(`Error loading topic ${slug}:`, error)
    return null
  }
}

/**
 * Get all topics with basic metadata
 */
export async function getAllTopics(): Promise<Array<{slug: string, title: string, description: string}>> {
  const slugs = await getAllTopicSlugs()
  const topics = []
  
  for (const slug of slugs) {
    const topic = await getTopicBySlug(slug)
    if (topic) {
      topics.push({
        slug: topic.slug,
        title: topic.title,
        description: topic.description
      })
    }
  }
  
  return topics
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