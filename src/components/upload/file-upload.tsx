'use client'

import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X } from 'lucide-react'

interface FileUploadProps {
  files: File[]
  onFilesChanged: (files: File[]) => void
  disabled?: boolean
}

const MAX_FILES = 5
const MAX_FILE_SIZE = 30 * 1024 * 1024 // 30MB

export function FileUpload({ files, onFilesChanged, disabled = false }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check if adding these files would exceed the limit
    if (files.length + acceptedFiles.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed`)
      return
    }

    // Add new files to existing ones
    onFilesChanged([...files, ...acceptedFiles])
  }, [files, onFilesChanged])

  const removeFile = useCallback((fileToRemove: File) => {
    onFilesChanged(files.filter(file => file !== fileToRemove))
  }, [files, onFilesChanged])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxSize: MAX_FILE_SIZE,
    disabled,
    multiple: true,
  })

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-muted/30'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        
        {isDragActive ? (
          <p className="text-lg">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drop files here or click to select
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, TXT, MD files • Max {MAX_FILES} files, 30MB each
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="font-medium">Selected Files ({files.length}/{MAX_FILES})</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-muted p-3 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}