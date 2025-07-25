'use client'

import { useState, useEffect, useCallback } from 'react'

interface QuizAnswers {
  [blankId: string]: string
}

interface QuizValidation {
  [blankId: string]: boolean
}

interface QuizState {
  answers: QuizAnswers
  validationResults: QuizValidation
  currentSectionIndex: number
}

export function useQuizStorage(topicId: string) {
  const storageKey = `quiz-${topicId}`
  
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [validationResults, setValidationResults] = useState<QuizValidation>({})
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsedState: QuizState = JSON.parse(stored)
        setAnswers(parsedState.answers || {})
        setValidationResults(parsedState.validationResults || {})
        setCurrentSectionIndex(parsedState.currentSectionIndex || 0)
      }
    } catch (error) {
      console.error('Failed to load quiz state from localStorage:', error)
    }
  }, [storageKey])
  
  // Save current state to localStorage
  const saveCurrentState = useCallback(() => {
    try {
      const stateToSave: QuizState = {
        answers,
        validationResults,
        currentSectionIndex
      }
      localStorage.setItem(storageKey, JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Failed to save quiz state to localStorage:', error)
    }
  }, [storageKey, answers, validationResults, currentSectionIndex])
  
  // Auto-save whenever state changes
  useEffect(() => {
    saveCurrentState()
  }, [saveCurrentState])
  
  // Update answer for a specific blank
  const updateAnswer = useCallback((blankId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [blankId]: answer }))
  }, [])
  
  // Update validation result for a specific blank
  const updateValidation = useCallback((blankId: string, isCorrect: boolean) => {
    setValidationResults(prev => ({ ...prev, [blankId]: isCorrect }))
  }, [])
  
  // Update current section index
  const updateSectionIndex = useCallback((index: number) => {
    setCurrentSectionIndex(index)
  }, [])
  
  // Clear all stored data
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setAnswers({})
      setValidationResults({})
      setCurrentSectionIndex(0)
    } catch (error) {
      console.error('Failed to clear quiz storage:', error)
    }
  }, [storageKey])
  
  return {
    answers,
    validationResults,
    currentSectionIndex,
    updateAnswer,
    updateValidation,
    updateSectionIndex,
    clearStorage
  }
}