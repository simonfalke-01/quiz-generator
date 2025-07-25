'use client'

import { useState, useEffect, useCallback } from 'react'

interface RecentTopic {
  topicCode: string
  title: string
  accessedAt: string
}

export function useRecentTopics() {
  const [recentTopics, setRecentTopics] = useState<RecentTopic[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('recent-topics')
      if (stored) {
        const topics = JSON.parse(stored) as RecentTopic[]
        setRecentTopics(topics)
      }
    } catch (error) {
      console.error('Failed to load recent topics:', error)
    }
  }, [])

  // Save to localStorage whenever state changes
  const saveToStorage = useCallback((topics: RecentTopic[]) => {
    try {
      localStorage.setItem('recent-topics', JSON.stringify(topics))
    } catch (error) {
      console.error('Failed to save recent topics:', error)
    }
  }, [])

  // Add or update a topic
  const addTopic = useCallback((topicCode: string, title: string) => {
    setRecentTopics(prev => {
      const now = new Date().toISOString()
      const filtered = prev.filter(t => t.topicCode !== topicCode)
      const newTopics = [{ topicCode, title, accessedAt: now }, ...filtered].slice(0, 10) // Keep only 10 most recent
      saveToStorage(newTopics)
      return newTopics
    })
  }, [saveToStorage])

  // Remove a topic
  const removeTopic = useCallback((topicCode: string) => {
    setRecentTopics(prev => {
      const newTopics = prev.filter(t => t.topicCode !== topicCode)
      saveToStorage(newTopics)
      return newTopics
    })
  }, [saveToStorage])

  // Clear all topics
  const clearTopics = useCallback(() => {
    setRecentTopics([])
    try {
      localStorage.removeItem('recent-topics')
    } catch (error) {
      console.error('Failed to clear recent topics:', error)
    }
  }, [])

  return {
    recentTopics,
    addTopic,
    removeTopic,
    clearTopics
  }
}