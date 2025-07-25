"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Copy, Check, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface RecentTopic {
  topicCode: string;
  title: string;
  accessedAt: string;
}

interface RecentTopicsProps {
  topics: RecentTopic[];
  onRemoveTopic: (topicCode: string) => void;
  onClearAll: () => void;
}

export function RecentTopics({
  topics,
  onRemoveTopic,
  onClearAll,
}: RecentTopicsProps) {
  const [copiedCodes, setCopiedCodes] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleCopy = async (topicCode: string) => {
    try {
      await navigator.clipboard.writeText(topicCode);
      setCopiedCodes((prev) => new Set(prev).add(topicCode));
      setTimeout(() => {
        setCopiedCodes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(topicCode);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error("Failed to copy topic code:", err);
    }
  };

  const handleNavigate = (topicCode: string) => {
    router.push(`/topics/${topicCode}`);
  };

  const formatAccessTime = (accessedAt: string) => {
    const date = new Date(accessedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center space-x-2 text-lg font-semibold">
            <Clock className="h-5 w-5" />
            <span>Recent Topics</span>
          </h2>
          {topics.length > 0 && (
            <Button
              onClick={onClearAll}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {topics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              No recent topics yet
            </p>
          </div>
        ) : (
          topics.map((topic) => (
            <div
              key={topic.topicCode}
              className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-start justify-between space-x-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <code className="text-sm font-mono font-extrabold text-foreground leading-none mt-2">
                      {topic.topicCode}
                    </code>
                    <Button
                      onClick={() => handleCopy(topic.topicCode)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground mt-1"
                    >
                      {copiedCodes.has(topic.topicCode) ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <h3 className="text-base font-medium text-foreground mb-1 leading-tight">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatAccessTime(topic.accessedAt)}
                  </p>
                </div>
                <div className="flex flex-col space-y-1">
                  <Button
                    onClick={() => handleNavigate(topic.topicCode)}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onRemoveTopic(topic.topicCode)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
