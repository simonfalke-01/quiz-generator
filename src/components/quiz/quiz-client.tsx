'use client'

import React, { useRef, useCallback, useMemo } from 'react'
import { Topic } from '@/lib/types'
import { Question } from './question'
// Removed Card imports to eliminate card styling
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useQuizStorage } from '@/hooks/use-quiz-storage'

interface QuizClientProps {
  topicData: Topic
  topicId: string
}

export function QuizClient({ topicData, topicId }: QuizClientProps) {
  const {
    answers,
    validationResults,
    currentSectionIndex,
    updateAnswer,
    updateValidation,
    updateSectionIndex
  } = useQuizStorage(topicId)
  
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
    updateValidation(blankId, isCorrect)
  }, [updateValidation])

  const handleCorrectAnswer = useCallback((blankId: string) => {
    // Find the next blank input and focus it
    const currentIndex = allBlankIds.indexOf(blankId)
    if (currentIndex !== -1 && currentIndex < allBlankIds.length - 1) {
      const nextBlankId = allBlankIds[currentIndex + 1]
      // Immediate focus for faster auto-tabbing
      const nextInput = inputRefs.current[nextBlankId]
      if (nextInput) {
        nextInput.focus()
      }
    }
  }, [allBlankIds])

  // Calculate progress based on validation results
  const totalBlanks = allBlankIds.length
  const answeredBlanks = Object.values(validationResults).filter(Boolean).length
  const progressPercentage = totalBlanks > 0 ? (answeredBlanks / totalBlanks) * 100 : 0

  const currentSection = topicData.sections[currentSectionIndex]

  return (
    <div className="h-full flex flex-col">
      {/* Sticky Progress and Navigation Section */}
      <div className="sticky top-[120px] md:top-[140px] z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-3 md:py-4">
          {/* Progress Section */}
          <div className="mb-3 md:mb-4">
            <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center mb-2 gap-1">
              <span className="text-xs md:text-sm font-medium text-foreground">
                Progress: {answeredBlanks} / {totalBlanks} blanks completed
              </span>
              <span className="text-xs md:text-sm text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap gap-1.5 md:gap-2 justify-center sm:justify-start">
            {topicData.sections.map((section, index) => (
              <Button
                key={section.id}
                onClick={() => updateSectionIndex(index)}
                variant={index === currentSectionIndex ? "default" : "outline"}
                size="sm"
                className={`transition-all duration-200 h-8 md:h-9 text-xs md:text-sm ${
                  index === currentSectionIndex 
                    ? 'min-w-[72px] md:min-w-[80px] px-2 md:px-3' 
                    : 'min-w-[32px] md:min-w-[36px] px-1.5 md:px-2'
                }`}
              >
                {index === currentSectionIndex ? `Section ${index + 1}` : index + 1}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full px-4 md:px-6 py-4 md:py-6">
          <div className="mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-semibold">
              {currentSection.title}
            </h2>
          </div>
          <div className="space-y-3 md:space-y-4">
            {currentSection.questions.map(question => (
              <Question
                key={question.id}
                question={question}
                onValidationChange={handleValidationChange}
                onCorrectAnswer={handleCorrectAnswer}
                onAnswerChange={updateAnswer}
                answers={answers}
                inputRefs={inputRefs}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="max-w-6xl mx-auto w-full p-4 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <Button
            onClick={() => updateSectionIndex(Math.max(0, currentSectionIndex - 1))}
            disabled={currentSectionIndex === 0}
            variant="outline"
            size="lg"
            className="h-12 text-sm md:text-base"
          >
            ← Previous Section
          </Button>
          
          <Button
            onClick={() => updateSectionIndex(Math.min(topicData.sections.length - 1, currentSectionIndex + 1))}
            disabled={currentSectionIndex === topicData.sections.length - 1}
            size="lg"
            className="h-12 text-sm md:text-base"
          >
            Next Section →
          </Button>
          </div>
        </div>
      </div>
    </div>
  )
}