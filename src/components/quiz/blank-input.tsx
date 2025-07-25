'use client'

import * as React from "react"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { getValidationStatus } from "@/lib/validation"

interface BlankInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  blankId: string
  correctAnswers: string[]
  onValidationChange: (blankId: string, isCorrect: boolean) => void
  onCorrectAnswer?: (blankId: string) => void
  onAnswerChange?: (blankId: string, answer: string) => void
  storedAnswer?: string
  debounceMs?: number
}

export const BlankInput = React.forwardRef<HTMLInputElement, BlankInputProps>(
  ({ 
    className, 
    blankId,
    correctAnswers, 
    onValidationChange, 
    onCorrectAnswer,
    onAnswerChange,
    storedAnswer = '',
    debounceMs = 50,
    ...props 
  }, ref) => {
    // Smart hint system - no hint for single character answers
    const hint = React.useMemo(() => {
      const firstAnswer = correctAnswers[0] || ''
      // If the answer is single character, return no hint
      if (firstAnswer.length <= 1) {
        return ''
      }
      // Otherwise, return the first letter as the hint
      return firstAnswer.charAt(0).toLowerCase()
    }, [correctAnswers])
    
    // Simple state - just what the user types in the input
    const [userInput, setUserInput] = React.useState(storedAnswer || '')
    const [hasBeenValidated, setHasBeenValidated] = React.useState(false) 
    const [isRevealed, setIsRevealed] = React.useState(false)
    
    // Update local state when stored answer changes
    React.useEffect(() => {
      setUserInput(storedAnswer || '')
      if (storedAnswer) {
        setHasBeenValidated(true)
      }
    }, [storedAnswer])
    const debouncedValue = useDebounce(userInput, debounceMs)

    // Handle debounced validation
    React.useEffect(() => {
      // Do not run validation logic when the answer is being revealed
      if (isRevealed) {
        return
      }

      if (debouncedValue !== '') {
        setHasBeenValidated(true)
        const fullAnswer = hint + debouncedValue
        
        const validationStatus = getValidationStatus(fullAnswer, correctAnswers, true)
        const isCorrect = validationStatus === 'correct'
        
        // Only notify parent of validation result, not raw input value
        onValidationChange(blankId, isCorrect)
        
        if (isCorrect && onCorrectAnswer) {
          onCorrectAnswer(blankId)
        }
      } else {
        onValidationChange(blankId, false)
        setHasBeenValidated(false)
      }
    }, [debouncedValue, hint, correctAnswers, onValidationChange, onCorrectAnswer, isRevealed, blankId])

    // For validation display, combine hint + user input
    const fullAnswer = hint + userInput
    const validationStatus = getValidationStatus(fullAnswer, correctAnswers, hasBeenValidated)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setUserInput(newValue)
      
      // Store the answer
      if (onAnswerChange) {
        onAnswerChange(blankId, newValue)
      }
      
      // If input is cleared, reset validation
      if (newValue === '') {
        setHasBeenValidated(false)
      }
    }

    return (
      <div className="inline-flex items-center mx-1 gap-1">
        {/* Input wrapper with visual hint overlay */}
        <div className="relative">
          {/* Visual hint letter overlay - only show if hint exists */}
          {hint && (
            <span 
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none select-none z-10",
                {
                  "text-muted-foreground": validationStatus === "unchecked",
                  "text-success-foreground": validationStatus === "correct", 
                  "text-destructive-foreground": validationStatus === "incorrect",
                }
              )}
              aria-hidden="true"
            >
              {hint}
            </span>
          )}
          
          {/* Standard input with conditional left padding for hint */}
          <input
            ref={ref}
            type="text"
            className={cn(
              `w-36 sm:w-40 h-10 md:h-9 ${hint ? 'pl-6' : 'pl-3'} pr-3 py-2 text-sm md:text-base border rounded-md bg-background transition-all duration-300 outline-none`,
              {
                "border-input focus:ring-2 focus:ring-ring focus:border-ring": validationStatus === "unchecked",
                "border-success bg-success/10 focus:ring-2 focus:ring-success": validationStatus === "correct",
                "border-destructive bg-destructive/10 focus:ring-2 focus:ring-destructive": validationStatus === "incorrect",
              },
              className
            )}
            value={isRevealed ? (hint ? correctAnswers[0].slice(1) : correctAnswers[0]) : userInput}
            readOnly={isRevealed}
            onChange={handleInputChange}
            aria-label={hint ? `Fill in the blank, starts with ${hint}` : "Fill in the blank"}
            inputMode="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            {...props}
          />
        </div>
        
        {/* Touch/Hover-to-reveal answer button */}
        <button
          type="button"
          onMouseEnter={() => setIsRevealed(true)}
          onMouseLeave={() => setIsRevealed(false)}
          onTouchStart={() => setIsRevealed(true)}
          onTouchEnd={() => setIsRevealed(false)}
          tabIndex={-1}
          className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-secondary hover:bg-secondary/80 active:bg-secondary/80 flex items-center justify-center text-xs text-secondary-foreground hover:text-secondary-foreground/80 transition-colors touch-manipulation"
          aria-label="Touch/hover to show correct answer"
        >
          ?
        </button>
        
      </div>
    )
  }
)

BlankInput.displayName = "BlankInput"