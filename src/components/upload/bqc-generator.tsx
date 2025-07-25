'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface BQCGeneratorProps {
  fileUrl?: string | null
  fileKey?: string | null
  fileName: string
  fileType: string
  onSuccess: (topicCode: string) => void
  onError: (error: string) => void
}

interface StreamMessage {
  type: 'processing' | 'analyzing' | 'generating' | 'finalizing' | 'success' | 'error'
  content?: string
  topicId?: string
  message?: string
  rawContent?: string
  metadata?: {
    chunkCount?: number
    processingMethod?: string
    costEstimate?: number
  }
}

export function BQCGenerator({ 
  fileUrl, 
  fileKey, 
  fileName, 
  fileType, 
  onSuccess, 
  onError 
}: BQCGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle')
  const [currentStage, setCurrentStage] = useState<'processing' | 'analyzing' | 'generating' | 'finalizing' | ''>('')
  const [error, setError] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const startGeneration = useCallback(async () => {
    setIsGenerating(true)
    setGeneratedContent('')
    setProgress(10)
    setStatus('generating')
    setError('')

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/generate-bqc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileUrl,
          fileKey,
          fileName,
          fileType
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start BQC generation')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream available')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: StreamMessage = JSON.parse(line.slice(6))
              
              switch (data.type) {
                case 'processing':
                  setCurrentStage('processing')
                  setProgress(15)
                  break
                  
                case 'analyzing':
                  setCurrentStage('analyzing')
                  setGeneratedContent(prev => prev + (data.content || ''))
                  setProgress(30)
                  break
                  
                case 'generating':
                  setCurrentStage('generating')
                  setGeneratedContent(prev => prev + (data.content || ''))
                  setProgress(prev => Math.min(prev + 3, 75))
                  break
                  
                case 'finalizing':
                  setCurrentStage('finalizing')
                  setProgress(90)
                  break
                
                case 'success':
                  setStatus('success')
                  setProgress(100)
                  setIsGenerating(false)
                  if (data.topicId) {
                    onSuccess(data.topicId)
                  }
                  break
                
                case 'error':
                  setStatus('error')
                  setIsGenerating(false)
                  const errorMsg = data.message || 'Generation failed'
                  setError(errorMsg)
                  onError(errorMsg)
                  break
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError)
            }
          }
        }
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setStatus('idle')
        setProgress(0)
      } else {
        setStatus('error')
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMsg)
        onError(errorMsg)
      }
      setIsGenerating(false)
    }
  }, [fileUrl, fileKey, fileName, fileType, onSuccess, onError])

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsGenerating(false)
    setStatus('idle')
    setCurrentStage('')
    setProgress(0)
  }

  // Auto-start generation when component mounts
  useEffect(() => {
    startGeneration()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fileUrl, fileKey, fileName, fileType, startGeneration])

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
        switch (currentStage) {
          case 'processing':
            return 'Starting AI analysis...'
          case 'analyzing':
            return 'Analyzing document content...'
          case 'generating':
            return 'Generating quiz questions...'
          case 'finalizing':
            return 'Finalizing quiz structure...'
          default:
            return 'Processing file...'
        }
      case 'success':
        return 'Quiz generated successfully!'
      case 'error':
        return 'Generation failed'
      default:
        return 'Ready to generate'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>BQC Quiz Generation</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Generating interactive quiz from: {fileName}
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

        {/* Generated Content Preview */}
        {generatedContent && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Generated Content Preview:</h4>
            <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-md p-4">
              <pre className="text-xs whitespace-pre-wrap font-mono">
                {generatedContent}
              </pre>
            </div>
          </div>
        )}

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

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {isGenerating ? (
            <Button
              variant="outline"
              onClick={cancelGeneration}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Cancel Generation
            </Button>
          ) : status === 'error' ? (
            <Button
              onClick={startGeneration}
              variant="outline"
            >
              Retry Generation
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}