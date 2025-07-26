/**
 * Validates a user's answer against an array of correct answers
 * Handles both partial answers (without first letter) and complete answers (with first letter)
 * @param userInput - The user's input string
 * @param correctAnswers - Array of correct answer strings
 * @param hint - Optional hint letter (first letter of the answer)
 * @returns boolean indicating if the answer is correct
 */
export function validateAnswer(userInput: string, correctAnswers: string[], hint?: string): boolean {
  const normalizedInput = userInput.trim().toLowerCase()
  if (normalizedInput === '') return false

  const normalizedAnswers = correctAnswers.map(answer => answer.toLowerCase().trim())
  
  // Check direct match (complete word)
  if (normalizedAnswers.includes(normalizedInput)) {
    return true
  }
  
  // Check with hint prefix (partial word)
  if (hint) {
    const normalizedHint = hint.toLowerCase().trim()
    const withHint = normalizedHint + normalizedInput
    return normalizedAnswers.includes(withHint)
  }
  
  return false
}

/**
 * Normalizes user input by removing the first letter if it matches the hint
 * Used for smooth animation when user types complete word
 * @param userInput - The user's input string
 * @param hint - The hint letter (first letter)
 * @param correctAnswers - Array of correct answer strings
 * @returns normalized input without the first letter if it was included
 */
export function normalizeAnswer(userInput: string, hint: string, correctAnswers: string[]): string {
  const normalizedInput = userInput.trim().toLowerCase()
  const normalizedAnswers = correctAnswers.map(answer => answer.toLowerCase().trim())
  
  // If user typed the complete word, remove the first letter
  if (normalizedAnswers.includes(normalizedInput)) {
    return userInput.trim().substring(1)
  }
  
  return userInput.trim()
}

/**
 * Determines validation status for UI feedback
 * @param value - Current input value
 * @param correctAnswers - Array of correct answers
 * @param hasBeenValidated - Whether validation has been triggered
 * @param hint - Optional hint letter (first letter of the answer)
 * @returns validation status for UI styling
 */
export function getValidationStatus(
  value: string, 
  correctAnswers: string[], 
  hasBeenValidated: boolean,
  hint?: string
): 'correct' | 'incorrect' | 'unchecked' {
  if (!hasBeenValidated || value.trim() === '') {
    return 'unchecked'
  }
  
  return validateAnswer(value, correctAnswers, hint) ? 'correct' : 'incorrect'
}