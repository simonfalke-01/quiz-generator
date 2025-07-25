'use client'

import React from 'react'
import { Question as QuestionType } from '@/lib/types'
import { BlankInput } from './blank-input'

interface QuestionProps {
  question: QuestionType
  onValidationChange: (blankId: string, isCorrect: boolean) => void
  onCorrectAnswer?: (blankId: string) => void
  inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
}

export function Question({ 
  question, 
  onValidationChange,
  onCorrectAnswer,
  inputRefs
}: QuestionProps) {

  return (
    <div className="mb-6 p-4 sm:p-6 bg-card text-card-foreground rounded-lg border shadow-sm">
      <div className="mb-3">
        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          Question {question.questionNumber}
        </span>
      </div>
      
      <div className="text-base sm:text-lg leading-relaxed">
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