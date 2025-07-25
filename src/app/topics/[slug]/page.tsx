import { getTopicById } from '@/lib/questions'
import { TopicTabs } from '@/components/tabs/topic-tabs'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function TopicPage({ params }: PageProps) {
  const { slug: topicId } = await params
  const topicData = await getTopicById(topicId)

  if (!topicData) {
    notFound()
  }

  return <TopicTabs topicData={topicData} topicId={topicId} />
}

export async function generateMetadata({ params }: PageProps) {
  const { slug: topicId } = await params
  const topicData = await getTopicById(topicId)
  
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