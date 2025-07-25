"use client";

import { useState } from "react";
import { FileUpload } from "./file-upload";
import { BQCGenerator } from "./bqc-generator";
import { TopicCodeInput } from "./topic-code-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RecentTopics } from "@/components/recent-topics";
import { useRecentTopics } from "@/hooks/use-recent-topics";

type UploadStep = "select" | "uploading" | "generating" | "complete" | "error";

export function UploadPage() {
  const { recentTopics, removeTopic, clearTopics } = useRecentTopics();
  
  const [step, setStep] = useState<UploadStep>("select");
  const [files, setFiles] = useState<File[]>([]);
  const [questionCount, setQuestionCount] = useState(100);
  const [questionCountInput, setQuestionCountInput] = useState("100");
  const [generatedTopicCode, setGeneratedTopicCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setStep("uploading");
    setError(null);

    try {
      const formData = new FormData();
      
      // Add all files with the same key name
      files.forEach(file => {
        formData.append('files', file);
      });
      
      formData.append('questionCount', questionCount.toString());

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      // API returns topicId immediately
      const result = await response.json();
      setGeneratedTopicCode(result.topicId);
      setStep("generating");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);
      setStep("error");
    }
  };

  const handleStartOver = () => {
    setStep("select");
    setFiles([]);
    setQuestionCount(100);
    setQuestionCountInput("100");
    setGeneratedTopicCode(null);
    setError(null);
  };

  const handleTopicCodeEnter = (code: string) => {
    console.log("Entering topic with code:", code);
  };

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setQuestionCountInput(input);
    
    // Update the actual value if it's a valid number
    const value = parseInt(input);
    if (!isNaN(value) && value >= 10 && value <= 500) {
      setQuestionCount(value);
    }
  };

  const handleQuestionCountBlur = () => {
    const value = parseInt(questionCountInput);
    if (isNaN(value) || value < 10) {
      setQuestionCount(100);
      setQuestionCountInput("100");
    } else if (value > 500) {
      setQuestionCount(500);
      setQuestionCountInput("500");
    }
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

            {/* Topic Code Input */}
            <div className="mb-8 w-full">
              <TopicCodeInput
                generatedTopicCode={step === "complete" ? generatedTopicCode || undefined : undefined}
                onTopicCodeEnter={handleTopicCodeEnter}
              />
            </div>

            {/* Upload Form */}
            {step === "select" && (
              <div className="space-y-6">
                {/* Upload Header with Question Count */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      Upload your documents
                    </h2>
                    <p className="text-muted-foreground">
                      Generate an interactive quiz from your study materials
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="question-count" className="text-sm font-medium whitespace-nowrap">
                      Questions:
                    </Label>
                    <Input
                      id="question-count"
                      type="number"
                      min="10"
                      max="500"
                      value={questionCountInput}
                      onChange={handleQuestionCountChange}
                      onBlur={handleQuestionCountBlur}
                      className="w-20"
                    />
                  </div>
                </div>

                <FileUpload
                  files={files}
                  onFilesChanged={setFiles}
                />

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleSubmit}
                  disabled={files.length === 0}
                  className="w-full"
                  size="lg"
                >
                  Generate Quiz ({questionCount} questions)
                </Button>
              </div>
            )}

            {/* Uploading State */}
            {step === "uploading" && (
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Uploading Files...</h3>
                <p className="text-muted-foreground">
                  Uploading {files.length} file{files.length > 1 ? 's' : ''} and starting quiz generation
                </p>
              </div>
            )}

            {/* Generating State */}
            {step === "generating" && generatedTopicCode && (
              <BQCGenerator
                topicId={generatedTopicCode}
                onSuccess={() => setStep("complete")}
                onError={(error) => {
                  setError(error);
                  setStep("error");
                }}
              />
            )}

            {/* Success State */}
            {step === "complete" && (
              <div className="space-y-4 text-center">
                <div className="text-green-600">
                  <h3 className="text-xl font-semibold mb-2">
                    Quiz Generated Successfully!
                  </h3>
                  <p className="text-gray-600">
                    Your interactive quiz with {questionCount} questions is ready. Use the topic code above to access it.
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {step === "error" && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Generation Failed
                  </h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>

                <Button onClick={handleStartOver} variant="outline">
                  Try Again
                </Button>
              </div>
            )}
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

      {/* Footer */}
      <div className="w-full px-6 mt-auto pt-16 max-w-7xl mx-auto">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Your documents are processed securely and used only for quiz generation.
          </p>
        </div>
      </div>
    </div>
  );
}