'use client'

import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  isUploading?: boolean
  uploadProgress?: number
  error?: string
  success?: boolean
}

export function FileUpload({ 
  onFileSelect, 
  isUploading = false, 
  uploadProgress = 0,
  error,
  success 
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File) => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown']
    const allowedExtensions = ['.pdf', '.txt', '.md']

    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit')
    }

    const fileExtension = '.' + file.name.toLowerCase().split('.').pop()
    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.includes(fileExtension)

    if (!isValidType) {
      throw new Error('Please upload PDF, TXT, or MD files only')
    }

    return true
  }, [])

  const handleFileSelect = useCallback((file: File) => {
    try {
      validateFile(file)
      setSelectedFile(file)
      onFileSelect(file)
    } catch (err) {
      console.error('File validation error:', err)
    }
  }, [validateFile, onFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const getFileIcon = () => {
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  const getStatusIcon = () => {
    if (success) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (error) return <AlertCircle className="h-5 w-5 text-red-500" />
    return null
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full border-2 border-dashed border-muted rounded-lg p-12 text-center transition-all duration-200 ease-in-out
          ${isDragOver ? 'border-primary bg-primary/5 shadow-sm' : ''}
          ${isUploading ? 'pointer-events-none opacity-60' : 'cursor-pointer hover:border-primary/60 hover:bg-muted/30'}
        `}
        onClick={handleButtonClick}
      >
          <Label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleInputChange}
              className="sr-only"
              disabled={isUploading}
            />

          {!selectedFile ? (
            <div className="space-y-4 w-full">
              <div className="flex justify-center w-full">
                <Upload className="h-12 w-12 text-gray-400" />
              </div>
              <div className="w-full">
                <p className="text-lg font-medium text-gray-700">
                  {isDragOver ? 'Drop your file here' : 'Upload your document'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Drag and drop or click to select • PDF, TXT, MD • Max 10MB
                </p>
              </div>
              <Button 
                variant="outline" 
                disabled={isUploading}
                onClick={(e) => {
                  e.stopPropagation()
                  handleButtonClick()
                }}
              >
                Choose File
              </Button>
            </div>
          ) : (
            <div className="space-y-4 w-full">
              <div className="flex items-center justify-center space-x-3 w-full">
                {getFileIcon()}
                <div className="text-left">
                  <p className="font-medium text-gray-700">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                {getStatusIcon()}
              </div>

              {isUploading && (
                <div className="space-y-2 w-full">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    {uploadProgress < 50 ? 'Uploading...' : 'Generating quiz...'}
                  </p>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md w-full">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md w-full">
                  File processed successfully!
                </div>
              )}

              {!isUploading && !success && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Choose Different File
                </Button>
              )}
            </div>
          )}
          </Label>
      </div>
    </div>
  )
}