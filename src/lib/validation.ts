/**
 * Validates a user's answer against an array of correct answers
 * @param userInput - The user's input string
 * @param correctAnswers - Array of correct answer strings
 * @returns boolean indicating if the answer is correct
 */
export function validateAnswer(userInput: string, correctAnswers: string[]): boolean {
  const normalizedInput = userInput.trim().toLowerCase()
  if (normalizedInput === '') return false

  const normalizedAnswers = correctAnswers.map(answer => answer.toLowerCase().trim())
  
  return normalizedAnswers.includes(normalizedInput)
}

/**
 * Determines validation status for UI feedback
 * @param value - Current input value
 * @param correctAnswers - Array of correct answers
 * @param hasBeenValidated - Whether validation has been triggered
 * @returns validation status for UI styling
 */
export function getValidationStatus(
  value: string, 
  correctAnswers: string[], 
  hasBeenValidated: boolean
): 'correct' | 'incorrect' | 'unchecked' {
  if (!hasBeenValidated || value.trim() === '') {
    return 'unchecked'
  }
  
  return validateAnswer(value, correctAnswers) ? 'correct' : 'incorrect'
}