"use client";

import { useState } from "react";
import { FileUpload } from "./file-upload";
import { BQCGenerator } from "./bqc-generator";
import { TopicCodeInput } from "./topic-code-input";
import { FileValidator } from "@/lib/file-validation";
import { Button } from "@/components/ui/button";
import { RecentTopics } from "@/components/recent-topics";
import { useRecentTopics } from "@/hooks/use-recent-topics";

type UploadStep = "select" | "uploading" | "generating" | "complete" | "error";

interface UploadState {
  step: UploadStep;
  file: File | null;
  blobUrl: string | null;
  fileKey: string | null;
  uploadProgress: number;
  error: string | null;
  generatedTopicCode: string | null;
}

export function UploadPage() {
  const { recentTopics, addTopic, removeTopic, clearTopics } = useRecentTopics()
  const [uploadState, setUploadState] = useState<UploadState>({
    step: "select",
    file: null,
    blobUrl: null,
    fileKey: null,
    uploadProgress: 0,
    error: null,
    generatedTopicCode: null,
  });


  const handleFileSelect = async (file: File) => {
    // Validate file
    const validation = FileValidator.validateFile(file);
    if (!validation.valid) {
      setUploadState((prev) => ({
        ...prev,
        error: validation.error || "Invalid file",
        step: "error",
      }));
      return;
    }

    setUploadState((prev) => ({
      ...prev,
      file,
      step: "uploading",
      error: null,
      uploadProgress: 0,
    }));

    try {
      // Upload file to Vercel Blob
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const uploadResult = await uploadResponse.json();

      setUploadState((prev) => ({
        ...prev,
        blobUrl: uploadResult.file.url,
        fileKey: uploadResult.file.key,
        uploadProgress: 100,
        step: "generating",
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      setUploadState((prev) => ({
        ...prev,
        error: errorMessage,
        step: "error",
      }));
    }
  };

  const handleGenerationSuccess = (topicCode: string) => {
    setUploadState((prev) => ({
      ...prev,
      generatedTopicCode: topicCode,
      step: "complete",
    }));
  };

  const handleGenerationError = (error: string) => {
    setUploadState((prev) => ({
      ...prev,
      error,
      step: "error",
    }));
  };

  const handleStartOver = () => {
    setUploadState({
      step: "select",
      file: null,
      blobUrl: null,
      fileKey: null,
      uploadProgress: 0,
      error: null,
      generatedTopicCode: null,
    });
  };

  const handleTopicCodeEnter = (code: string) => {
    // This will be handled by the TopicCodeInput component's navigation
    console.log("Entering topic with code:", code);
  };

  return (
    <div className="min-h-screen bg-background py-8 flex flex-col">
      <div className="w-full px-6 flex-grow max-w-none">
        <div className="flex gap-12 max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="flex-1 max-w-3xl">
            {/* Header */}
            <div className="mb-12 text-left">
              <h1 className="text-4xl font-bold text-foreground mb-4">
                Quiz Generator
              </h1>
              <p className="text-xl text-muted-foreground mb-2">
                Upload your study materials and create interactive quizzes instantly
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, TXT, and Markdown files
              </p>
            </div>

            {/* Topic Code Input (Always visible at top) */}
            <div className="mb-12 w-full">
              <TopicCodeInput
                generatedTopicCode={uploadState.generatedTopicCode || undefined}
                onTopicCodeEnter={handleTopicCodeEnter}
              />
            </div>

            {/* Main Content Area */}
            <div className="space-y-8 w-full">
          {/* File Upload Section */}
          {(uploadState.step === "select" || uploadState.step === "error") && (
            <div className="space-y-6 w-full">
              <div className="text-left">
                <h2 className="text-2xl font-semibold text-foreground mb-3">
                  Create New Quiz
                </h2>
                <p className="text-muted-foreground">
                  Upload your document to generate an interactive quiz
                </p>
              </div>

              <div className="w-full">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  error={uploadState.error || undefined}
                />
              </div>

              {uploadState.step === "error" && (
                <div className="text-left">
                  <Button onClick={handleStartOver} variant="link" size="sm">
                    Try uploading a different file
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploadState.step === "uploading" && uploadState.file && (
            <div className="w-full">
              <FileUpload
                onFileSelect={() => {}} // Not needed during upload
                isUploading={true}
                uploadProgress={uploadState.uploadProgress}
              />
            </div>
          )}

          {/* BQC Generation */}
          {uploadState.step === "generating" &&
            (uploadState.blobUrl || uploadState.fileKey) &&
            uploadState.file && (
              <div className="w-full">
                <BQCGenerator
                  fileUrl={uploadState.blobUrl}
                  fileKey={uploadState.fileKey}
                  fileName={uploadState.file.name}
                  fileType={FileValidator.getFileType(
                    uploadState.file.name,
                    uploadState.file.type,
                  )}
                  onSuccess={handleGenerationSuccess}
                  onError={handleGenerationError}
                />
              </div>
            )}

          {/* Success State */}
          {uploadState.step === "complete" && (
            <div className="space-y-4 text-left">
              <div className="text-green-600">
                <h3 className="text-xl font-semibold mb-2">
                  Quiz Generated Successfully!
                </h3>
                <p className="text-gray-600">
                  Your interactive quiz is ready. Use the topic code above to
                  access it.
                </p>
              </div>

              <Button onClick={handleStartOver} variant="link">
                Create Another Quiz
              </Button>
            </div>
          )}
            </div>
          </div>

          {/* Recent Topics Sidebar */}
          <div className="flex-1 max-w-sm">
            <RecentTopics
              topics={recentTopics}
              onRemoveTopic={removeTopic}
              onClearAll={clearTopics}
            />
          </div>
        </div>
      </div>

      {/* Footer - Now at bottom of page */}
      <div className="w-full px-6 mt-auto pt-16 max-w-7xl mx-auto">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Your documents are processed securely and used only for quiz
            generation.
          </p>
        </div>
      </div>
    </div>
  );
}
