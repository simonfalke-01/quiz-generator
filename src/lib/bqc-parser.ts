import { Topic, Section, Question, QuestionContent } from './types'
import matter from 'gray-matter'

interface BQCMetadata {
  slug: string
  title: string
  description: string
  author?: string
  version?: string
}

/**
 * Parse BQC (BioQuiz Compact) format into Topic structure
 */
export function parseBQC(content: string): Topic {
  const { data, content: body } = matter(content)
  const metadata = data as BQCMetadata

  // Validate required metadata
  if (!metadata.slug || !metadata.title || !metadata.description) {
    throw new Error('BQC file must contain slug, title, and description in frontmatter')
  }

  const sections: Section[] = []
  const lines = body.split('\n')
  let currentSection: Section | null = null
  let currentQuestion: Question | null = null
  let questionLineBuffer: string[] = []

  const flushCurrentQuestion = () => {
    if (currentQuestion && questionLineBuffer.length > 0) {
      let fullQuestionText = questionLineBuffer.join('\n').trim()
      // Remove any ID tags from the question text
      fullQuestionText = fullQuestionText.replace(/\s*\[#[^\]]+\]\s*$/, '')
      currentQuestion.content = parseQuestionContent(fullQuestionText, currentQuestion.id)
      questionLineBuffer = []
    }
  }

  const flushCurrentSection = () => {
    flushCurrentQuestion()
    if (currentSection) {
      sections.push(currentSection)
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Skip empty lines
    if (!line.trim()) {
      if (currentQuestion) {
        questionLineBuffer.push(line)
      }
      continue
    }

    // Section line: § Section Title [#optional-id]
    if (line.startsWith('§')) {
      flushCurrentSection()
      const sectionMatch = line.match(/^§\s*(.+?)(?:\s*\[#([^\]]+)\])?$/)
      if (sectionMatch) {
        const title = sectionMatch[1].trim()
        const id = sectionMatch[2] || `section-${sections.length + 1}`
        currentSection = { id, title, questions: [] }
        currentQuestion = null
      }
      continue
    }

    // Question line: 1. Question text... [#optional-id]
    const questionMatch = line.match(/^(\d+)\.\s+(.+?)(?:\s*\[#([^\]]+)\])?$/)
    if (questionMatch) {
      flushCurrentQuestion()
      
      if (!currentSection) {
        // Create default section if none exists
        currentSection = { id: 'section-1', title: 'Questions', questions: [] }
      }

      const questionNumber = parseInt(questionMatch[1])
      let questionText = questionMatch[2]
      const questionId = questionMatch[3] || `q${questionNumber}`

      // Remove any trailing ID tag from the question text
      questionText = questionText.replace(/\s*\[#[^\]]+\]\s*$/, '')

      currentQuestion = {
        id: questionId,
        questionNumber,
        content: [] // Will be populated when flushed
      }
      
      currentSection.questions.push(currentQuestion)
      questionLineBuffer = [questionText]
      continue
    }

    // Continuation line of current question
    if (currentQuestion) {
      questionLineBuffer.push(line)
    }
  }

  // Flush any remaining content
  flushCurrentSection()

  return {
    slug: metadata.slug,
    title: metadata.title,
    description: metadata.description,
    sections
  }
}

/**
 * Parse question content with blanks
 * Format: {answer|alt::placeholder}
 */
function parseQuestionContent(text: string, questionId: string): QuestionContent[] {
  const content: QuestionContent[] = []
  let lastIndex = 0
  let blankIndex = 0

  // Regex to match {answer|alt::placeholder} or {answer|alt} or {answer}
  const blankRegex = /\{([^}]+)\}/g

  let match
  while ((match = blankRegex.exec(text)) !== null) {
    // Add text before the blank
    if (match.index > lastIndex) {
      const textValue = text.slice(lastIndex, match.index)
      if (textValue) {
        content.push({
          type: 'text',
          value: textValue
        })
      }
    }

    // Parse the blank content
    const blankContent = match[1]
    let answers: string[]
    let placeholder = ''

    // Check for placeholder syntax: answer::placeholder
    if (blankContent.includes('::')) {
      const [answerPart, placeholderPart] = blankContent.split('::', 2)
      answers = answerPart.split('|').map(a => a.trim()).filter(a => a.length > 0)
      placeholder = placeholderPart.trim()
    } else {
      // No placeholder, just answers
      answers = blankContent.split('|').map(a => a.trim()).filter(a => a.length > 0)
      placeholder = '...'
    }

    if (answers.length === 0) {
      throw new Error(`Invalid blank format in question ${questionId}: ${match[0]}`)
    }

    content.push({
      type: 'blank',
      id: `${questionId}-blank-${blankIndex}`,
      answers,
      placeholder
    })

    blankIndex++
    lastIndex = blankRegex.lastIndex
  }

  // Add remaining text after the last blank
  if (lastIndex < text.length) {
    const textValue = text.slice(lastIndex)
    if (textValue) {
      content.push({
        type: 'text',
        value: textValue
      })
    }
  }

  return content
}