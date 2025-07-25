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
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link href="/" className="text-lg font-semibold text-foreground hover:text-foreground/80 transition-colors cursor-pointer">
            Quiz Generator
          </Link>
        </div>
      </header>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        {/* Tab Header */}
        <div className="sticky top-[72px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {topicData.title}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {topicData.description}
                </p>
              </div>
              
              {/* Topic Code Display */}
              <div className="flex items-center space-x-2 ml-6">
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
            
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="quiz" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Quiz</span>
              </TabsTrigger>
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
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
            <div className="h-full max-w-6xl mx-auto p-6">
              <ChatClient topicId={topicId} topicTitle={topicData.title} />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}