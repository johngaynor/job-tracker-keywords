"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { keywordService } from "@/lib/db-services";
import { BarChart3, TrendingUp } from "lucide-react";

interface KeywordStat {
  keyword: string;
  totalCount: number;
  jobCount: number;
}

export function KeywordStats() {
  const [stats, setStats] = useState<KeywordStat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const keywordStats = await keywordService.getKeywordStats();
      setStats(keywordStats);
    } catch (error) {
      console.error("Error loading keyword stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading statistics...</div>;
  }

  if (stats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Keyword Statistics
          </CardTitle>
          <CardDescription>
            Track which keywords appear most frequently across your applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-zinc-500 py-4">
            No keywords tracked yet. Add some job applications to see
            statistics!
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...stats.map((s) => s.totalCount));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Keyword Statistics
        </CardTitle>
        <CardDescription>
          Most frequently mentioned keywords across all applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top keywords summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.length}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Unique Keywords
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.reduce((sum, s) => sum + s.totalCount, 0)}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Total Mentions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.max(...stats.map((s) => s.jobCount))}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Max Jobs per Keyword
              </div>
            </div>
          </div>

          {/* Keywords list */}
          <div className="space-y-3">
            {stats.slice(0, 20).map((stat, index) => (
              <div key={stat.keyword} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-500 w-6">
                      #{index + 1}
                    </span>
                    <span className="font-medium capitalize">
                      {stat.keyword}
                    </span>
                    {index < 3 && (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {stat.totalCount} mentions
                    </Badge>
                    <Badge variant="outline">{stat.jobCount} jobs</Badge>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(stat.totalCount / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {stats.length > 20 && (
            <div className="text-center text-sm text-zinc-500 pt-4 border-t">
              Showing top 20 keywords. Total: {stats.length} keywords tracked.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
