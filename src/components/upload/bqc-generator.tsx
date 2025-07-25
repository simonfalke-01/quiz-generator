'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface BQCGeneratorProps {
  topicId: string
  onSuccess: () => void
  onError: (error: string) => void
}

interface StreamMessage {
  type: 'processing' | 'analyzing' | 'generating' | 'finalizing' | 'success' | 'error'
  content?: string
  topicId?: string
  message?: string
  metadata?: {
    chunkCount?: number
    processingMethod?: string
    costEstimate?: number
    fileCount?: number
    questionCount?: number
  }
}

export function BQCGenerator({ topicId, onSuccess, onError }: BQCGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(true)
  const [generatedContent, setGeneratedContent] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'generating' | 'success' | 'error'>('generating')
  const [currentStage, setCurrentStage] = useState<'processing' | 'analyzing' | 'generating' | 'finalizing' | ''>('')
  const [error, setError] = useState('')
  const [metadata, setMetadata] = useState<{fileCount?: number, questionCount?: number}>({})
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const monitorGeneration = async () => {
      abortControllerRef.current = new AbortController()

      try {
        // Poll Redis for generation status
        const pollStatus = async () => {
          const response = await fetch(`/api/topics/${topicId}/status`)
          if (response.ok) {
            const statusData = await response.json()
            
            if (statusData.status === 'completed') {
              setProgress(100)
              setTimeout(() => {
                setStatus('success')
                setIsGenerating(false)
                onSuccess()
              }, 500)
              return true
            } else if (statusData.status === 'failed') {
              setStatus('error')
              setIsGenerating(false)
              const errorMsg = statusData.error || 'Generation failed'
              setError(errorMsg)
              onError(errorMsg)
              return true
            }
          }
          return false
        }

        // Poll every 2 seconds
        const pollInterval = setInterval(async () => {
          const isDone = await pollStatus()
          if (isDone) {
            clearInterval(pollInterval)
          } else {
            // Update progress gradually while generating
            setProgress(prev => Math.min(prev + 2, 90))
          }
        }, 2000)

        // Initial status check
        await pollStatus()

        return () => {
          clearInterval(pollInterval)
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
        }

      } catch (err) {
        setStatus('error')
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMsg)
        onError(errorMsg)
        setIsGenerating(false)
      }
    }

    monitorGeneration()
  }, [topicId, onSuccess, onError])

  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'generating':
        if (progress < 30) return 'Processing documents...'
        if (progress < 60) return 'Analyzing content...'
        if (progress < 90) return 'Generating quiz questions...'
        return 'Finalizing quiz structure...'
      case 'success':
        return 'Quiz generated successfully!'
      case 'error':
        return 'Generation failed'
      default:
        return 'Starting generation...'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>Quiz Generation</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Generating interactive quiz
          {metadata.fileCount && ` from ${metadata.fileCount} document${metadata.fileCount > 1 ? 's' : ''}`}
          {metadata.questionCount && ` (${metadata.questionCount} questions)`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{getStatusText()}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Generation Error</span>
            </div>
            <p className="mt-2 text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {status === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <span className="font-medium">Quiz Ready!</span>
            </div>
            <p className="mt-2 text-sm text-green-700">
              Your interactive quiz has been generated successfully. Use the topic code above to access it.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}