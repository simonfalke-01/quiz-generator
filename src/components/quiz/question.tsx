'use client'

import React from 'react'
import { Question as QuestionType } from '@/lib/types'
import { BlankInput } from './blank-input'
import { Badge } from '@/components/ui/badge'

interface QuestionProps {
  question: QuestionType
  onValidationChange: (blankId: string, isCorrect: boolean) => void
  onCorrectAnswer?: (blankId: string) => void
  onAnswerChange?: (blankId: string, answer: string) => void
  answers?: Record<string, string>
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
}

export function Question({ 
  question, 
  onValidationChange,
  onCorrectAnswer,
  onAnswerChange,
  answers = {},
  inputRefs
}: QuestionProps) {

  return (
    <div className="mb-3">
      <div className="mb-2">
        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 text-xs">
          Question {question.questionNumber}
        </Badge>
      </div>
      
      <div className="text-base sm:text-lg leading-snug">
      {question.content.map((item, index) => {
        if (item.type === 'text') {
          // Handle line breaks in text content
          return (
            <span key={index} className="whitespace-pre-wrap">
              {item.value}
            </span>
          )
        } else if (item.type === 'blank') {
          return (
            <BlankInput
              key={item.id}
              ref={(el) => { inputRefs.current[item.id] = el }}
              blankId={item.id}
              correctAnswers={item.answers}
              placeholder={item.placeholder}
              onValidationChange={onValidationChange}
              onCorrectAnswer={onCorrectAnswer}
              onAnswerChange={onAnswerChange}
              storedAnswer={answers[item.id] || ''}
              className="mx-1"
            />
          )
        }
        return null
      })}
      </div>
    </div>
  )
}