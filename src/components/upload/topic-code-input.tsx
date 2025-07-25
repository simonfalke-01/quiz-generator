'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, ExternalLink, AlertCircle } from 'lucide-react'

interface TopicCodeInputProps {
  generatedTopicCode?: string
  onTopicCodeEnter?: (code: string) => void
}

export function TopicCodeInput({ generatedTopicCode, onTopicCodeEnter }: TopicCodeInputProps) {
  const [inputCode, setInputCode] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const router = useRouter()

  const handleCopyCode = async () => {
    if (!generatedTopicCode) return
    
    try {
      await navigator.clipboard.writeText(generatedTopicCode)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy topic code:', err)
    }
  }

  const handleEnterTopic = async (code: string) => {
    const cleanCode = code.trim().toUpperCase()
    
    if (!cleanCode) {
      setError('Please enter a topic code')
      return
    }

    if (cleanCode.length < 6 || cleanCode.length > 10) {
      setError('Topic code should be 6-10 characters long')
      return
    }

    setIsValidating(true)
    setError('')

    try {
      // Validate topic code exists
      const response = await fetch(`/api/topics/${cleanCode}/validate`)
      
      if (response.ok) {
        onTopicCodeEnter?.(cleanCode)
        router.push(`/topics/${cleanCode}`)
      } else if (response.status === 404) {
        setError('Topic code not found. Please check and try again.')
      } else {
        setError('Failed to validate topic code. Please try again.')
      }
    } catch (err) {
      console.error('Topic validation error:', err)
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleEnterTopic(inputCode)
  }

  const handleGeneratedCodeClick = () => {
    if (generatedTopicCode) {
      handleEnterTopic(generatedTopicCode)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Generated Topic Code Display */}
      {generatedTopicCode && (
        <Card className="border-green-200 bg-green-50 w-full">
          <CardHeader className="pb-3 w-full">
            <CardTitle className="text-lg text-green-800">
              Quiz Generated Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 w-full">
            <div className="w-full">
              <p className="text-sm text-green-700 mb-2">
                Your topic code (share this with others):
              </p>
              <div className="flex items-center space-x-2 w-full">
                <code className="flex-1 px-4 py-3 bg-white border border-green-300 rounded-md font-mono text-lg text-center text-green-800 font-bold flex items-center justify-center">
                  {generatedTopicCode}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyCode}
                  className="border-green-300 text-green-700 hover:bg-green-100 flex-shrink-0 w-12 h-12 p-0"
                >
                  {copySuccess ? 'Copied!' : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="flex space-x-3 w-full">
              <Button
                onClick={handleGeneratedCodeClick}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={isValidating}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Start Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Topic Code Input */}
      <Card className="w-full">
        <CardHeader className="w-full">
          <CardTitle className="text-lg">
            Enter Topic Code
          </CardTitle>
          <p className="text-sm text-gray-600">
            Have a topic code? Enter it below to access an existing quiz.
          </p>
        </CardHeader>
        <CardContent className="w-full">
          <form onSubmit={handleInputSubmit} className="space-y-4 w-full">
            <div className="w-full">
              <Input
                type="text"
                placeholder="Enter topic code (e.g., ABC123XY)"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value)
                  setError('')
                }}
                className="text-center font-mono text-lg w-full"
                disabled={isValidating}
                maxLength={10}
              />
              {error && (
                <div className="flex items-center mt-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isValidating || !inputCode.trim()}
            >
              {isValidating ? 'Validating...' : 'Access Quiz'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}