import Link from 'next/link'
import { getAllTopics, getTopicBySlug } from '@/lib/questions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getTopicStats } from '@/lib/questions'

export default async function HomePage() {
  const topics = await getAllTopics()
  
  // Get detailed stats for each topic
  const topicsWithStats = await Promise.all(
    topics.map(async (topic) => {
      const fullTopic = await getTopicBySlug(topic.slug)
      if (fullTopic) {
        const stats = getTopicStats(fullTopic)
        return { ...topic, ...stats }
      }
      return { ...topic, totalSections: 0, totalQuestions: 0, totalBlanks: 0 }
    })
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Quiz Platform
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Interactive fill-in-the-blank quizzes for any subject
        </p>
      </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {topicsWithStats.map((topic) => (
            <Card key={topic.slug} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{topic.title}</CardTitle>
                <CardDescription className="text-base">
                  {topic.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{topic.totalSections}</span>
                      <br />
                      <span>Sections</span>
                    </div>
                    <div>
                      <span className="font-medium">{topic.totalQuestions}</span>
                      <br />
                      <span>Questions</span>
                    </div>
                    <div>
                      <span className="font-medium">{topic.totalBlanks}</span>
                      <br />
                      <span>Fill-in-blanks</span>
                    </div>
                  </div>
                </div>
                
                <Link href={`/topics/${topic.slug}`}>
                  <Button className="w-full">
                    Start Quiz
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

      {topics.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No topics available yet.</p>
        </div>
      )}
    </div>
  )
}