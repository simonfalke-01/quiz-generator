import { getTopicBySlug, getAllTopicSlugs } from '@/lib/questions'
import { QuizClient } from '@/components/quiz/quiz-client'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const slugs = await getAllTopicSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

export default async function TopicPage({ params }: PageProps) {
  const { slug } = await params
  const topicData = await getTopicBySlug(slug)

  if (!topicData) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <QuizClient topicData={topicData} />
    </main>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const topicData = await getTopicBySlug(slug)
  
  if (!topicData) {
    return {
      title: 'Topic Not Found',
    }
  }

  return {
    title: `${topicData.title} - Quiz Platform`,
    description: topicData.description,
  }
}