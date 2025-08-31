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

interface WeightedKeywordStat {
  keyword: string;
  totalCount: number;
  weightedScore: number;
  jobCount: number;
}

type ViewMode = "popular" | "targeted";

interface KeywordStatsProps {
  viewMode: ViewMode;
}

export function KeywordStats({ viewMode }: KeywordStatsProps) {
  const [popularStats, setPopularStats] = useState<KeywordStat[]>([]);
  const [targetedStats, setTargetedStats] = useState<WeightedKeywordStat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const [popular, targeted] = await Promise.all([
        keywordService.getKeywordStats(),
        keywordService.getWeightedKeywordStats(),
      ]);
      setPopularStats(popular);
      setTargetedStats(targeted);
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

  const currentStats = viewMode === "popular" ? popularStats : targetedStats;

  if (currentStats.length === 0) {
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

  const maxValue =
    viewMode === "popular"
      ? Math.max(...popularStats.map((s) => s.totalCount))
      : Math.max(...targetedStats.map((s) => s.weightedScore));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Keyword Statistics
        </CardTitle>
        <CardDescription>
          {viewMode === "popular"
            ? "Most frequently mentioned keywords across all applications"
            : "Keywords weighted by interest level in job applications"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top keywords summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {currentStats.length}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Unique Keywords
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {viewMode === "popular"
                  ? popularStats.reduce((sum, s) => sum + s.totalCount, 0)
                  : Math.round(
                      targetedStats.reduce((sum, s) => sum + s.weightedScore, 0)
                    )}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {viewMode === "popular" ? "Total Mentions" : "Weighted Score"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.max(...currentStats.map((s) => s.jobCount))}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Max Jobs per Keyword
              </div>
            </div>
          </div>

          {/* Keywords list */}
          <div className="space-y-3">
            {currentStats.slice(0, 20).map((stat, index) => (
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
                    {viewMode === "popular" ? (
                      <>
                        <Badge variant="secondary">
                          {stat.totalCount} mentions
                        </Badge>
                        <Badge variant="outline">{stat.jobCount} jobs</Badge>
                      </>
                    ) : (
                      <>
                        <Badge variant="secondary">
                          {Math.round(
                            (stat as WeightedKeywordStat).weightedScore * 10
                          ) / 10}{" "}
                          score
                        </Badge>
                        <Badge variant="outline">
                          {stat.totalCount} mentions
                        </Badge>
                        <Badge variant="outline">{stat.jobCount} jobs</Badge>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      viewMode === "popular"
                        ? "bg-blue-600 dark:bg-blue-500"
                        : "bg-purple-600 dark:bg-purple-500"
                    }`}
                    style={{
                      width: `${
                        viewMode === "popular"
                          ? (stat.totalCount / maxValue) * 100
                          : ((stat as WeightedKeywordStat).weightedScore /
                              maxValue) *
                            100
                      }%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {currentStats.length > 20 && (
            <div className="text-center text-sm text-zinc-500 pt-4 border-t">
              Showing top 20 keywords. Total: {currentStats.length} keywords
              tracked.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
