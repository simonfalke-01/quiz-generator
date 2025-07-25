'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizClient } from '@/components/quiz/quiz-client'
import { ChatClient } from './chat-client'
import { Topic } from '@/lib/types'
import { BookOpen, MessageCircle, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRecentTopics } from '@/hooks/use-recent-topics'
import Link from 'next/link'

interface TopicTabsProps {
  topicData: Topic
  topicId: string
}

export function TopicTabs({ topicData, topicId }: TopicTabsProps) {
  const { addTopic } = useRecentTopics()
  const [activeTab, setActiveTab] = useState('quiz')
  const [copySuccess, setCopySuccess] = useState(false)

  // Save topic to recent topics when component mounts
  useEffect(() => {
    addTopic(topicId.toUpperCase(), topicData.title)
  }, [topicId, topicData.title, addTopic])

  const handleCopyTopicCode = async () => {
    try {
      await navigator.clipboard.writeText(topicId.toUpperCase())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy topic code:', err)
    }
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4">
          <Link href="/" className="text-base md:text-lg font-semibold text-foreground hover:text-foreground/80 transition-colors cursor-pointer">
            Quiz Generator
          </Link>
        </div>
      </header>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        {/* Tab Header */}
        <div className="sticky top-[60px] md:top-[72px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="mb-3 md:mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {topicData.title}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm md:text-base">
                  {topicData.description}
                </p>
              </div>
              
              {/* Topic Code Display */}
              <div className="flex items-center space-x-2 sm:ml-6 self-start sm:self-auto">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Topic Code</div>
                  <code className="text-sm font-mono font-bold text-foreground">
                    {topicId.toUpperCase()}
                  </code>
                </div>
                <Button
                  onClick={handleCopyTopicCode}
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  {copySuccess ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <TabsList className="grid w-full max-w-md grid-cols-2 h-10 md:h-11">
              <TabsTrigger value="quiz" className="flex items-center space-x-1.5 md:space-x-2 text-sm">
                <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center space-x-1.5 md:space-x-2 text-sm">
                <MessageCircle className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>AI Chat</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0">
          <TabsContent value="quiz" className="mt-0 focus-visible:outline-none h-full">
            <QuizClient topicData={topicData} topicId={topicId} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0 focus-visible:outline-none h-full">
            <div className="h-full max-w-6xl mx-auto p-4 md:p-6">
              <ChatClient topicId={topicId} topicTitle={topicData.title} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}