'use client'

import React, { useState, useRef, useCallback, useMemo } from 'react'
import { Topic } from '@/lib/types'
import { Question } from './question'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

interface QuizClientProps {
  topicData: Topic
}

export function QuizClient({ topicData }: QuizClientProps) {
  // Only track validation results, not raw input values to prevent re-render cascade
  const [validationResults, setValidationResults] = useState<Record<string, boolean>>({})
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Get all blank IDs in order for auto-focus functionality
  const getAllBlankIds = useCallback(() => {
    const blankIds: string[] = []
    topicData.sections.forEach(section => {
      section.questions.forEach(question => {
        question.content.forEach(content => {
          if (content.type === 'blank') {
            blankIds.push(content.id)
          }
        })
      })
    })
    return blankIds
  }, [topicData.sections])

  const allBlankIds = useMemo(() => getAllBlankIds(), [getAllBlankIds])

  // Only called when validation status changes, not on every keystroke
  const handleValidationChange = useCallback((blankId: string, isCorrect: boolean) => {
    setValidationResults(prev => ({ ...prev, [blankId]: isCorrect }))
  }, [])

  const handleCorrectAnswer = useCallback((blankId: string) => {
    // Find the next blank input and focus it
    const currentIndex = allBlankIds.indexOf(blankId)
    if (currentIndex !== -1 && currentIndex < allBlankIds.length - 1) {
      const nextBlankId = allBlankIds[currentIndex + 1]
      // Use requestAnimationFrame instead of setTimeout for better timing
      requestAnimationFrame(() => {
        const nextInput = inputRefs.current[nextBlankId]
        if (nextInput) {
          nextInput.focus()
        }
      })
    }
  }, [allBlankIds])

  // Calculate progress based on validation results
  const totalBlanks = allBlankIds.length
  const answeredBlanks = Object.values(validationResults).filter(Boolean).length
  const progressPercentage = totalBlanks > 0 ? (answeredBlanks / totalBlanks) * 100 : 0

  const currentSection = topicData.sections[currentSectionIndex]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{topicData.title}</h1>
        <p className="text-muted-foreground mb-4">{topicData.description}</p>
        
        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              Progress: {answeredBlanks} / {totalBlanks} blanks completed
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}%
            </span>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </div>
      </div>

      {/* Section Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
          {topicData.sections.map((section, index) => (
            <button
              key={section.id}
              onClick={() => setCurrentSectionIndex(index)}
              className={`px-3 py-2 text-sm rounded-md transition-colors font-medium ${
                index === currentSectionIndex
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-sm'
              }`}
            >
              Section {index + 1}
            </button>
          ))}
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {currentSection.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentSection.questions.map(question => (
                <Question
                  key={question.id}
                  question={question}
                  onValidationChange={handleValidationChange}
                  onCorrectAnswer={handleCorrectAnswer}
                  inputRefs={inputRefs}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
        <button
          onClick={() => setCurrentSectionIndex(Math.max(0, currentSectionIndex - 1))}
          disabled={currentSectionIndex === 0}
          className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/80 transition-colors font-medium"
        >
          ← Previous Section
        </button>
        
        <button
          onClick={() => setCurrentSectionIndex(Math.min(topicData.sections.length - 1, currentSectionIndex + 1))}
          disabled={currentSectionIndex === topicData.sections.length - 1}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors font-medium"
        >
          Next Section →
        </button>
      </div>
    </div>
  )
}