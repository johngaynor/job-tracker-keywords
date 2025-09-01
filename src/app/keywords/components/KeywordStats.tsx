"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { keywordService, userKeywordService } from "@/lib/db-services";
import { UserKeyword } from "@/lib/database";
import { TECHNICAL_SKILLS, SOFT_SKILLS } from "@/lib/constants";
import { BarChart3, TrendingUp, Plus, X } from "lucide-react";
import { toast } from "sonner";

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

interface KeywordStatsProps {
  viewMode: "user" | "application";
}

export function KeywordStats({ viewMode }: KeywordStatsProps) {
  // Application keywords state
  const [popularStats, setPopularStats] = useState<KeywordStat[]>([]);
  const [missingSkillsStats, setMissingSkillsStats] = useState<WeightedKeywordStat[]>([]);
  const [applicationViewMode, setApplicationViewMode] = useState<
    "popular" | "missing"
  >("popular");

  // User keywords state
  const [userKeywords, setUserKeywords] = useState<UserKeyword[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const loadApplicationStats = async () => {
    try {
      const [popular, missingSkills] = await Promise.all([
        keywordService.getKeywordStats(),
        keywordService.getWeightedKeywordStats(),
      ]);
      setPopularStats(popular);
      setMissingSkillsStats(missingSkills);
    } catch (error) {
      console.error("Error loading keyword stats:", error);
    }
  };

  const loadUserKeywords = async () => {
    try {
      const keywords = await userKeywordService.getAll();
      setUserKeywords(keywords);
    } catch (error) {
      console.error("Error loading user keywords:", error);
    }
  };

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      if (viewMode === "application") {
        await loadApplicationStats();
      } else {
        await loadUserKeywords();
      }
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) {
      toast.error("Please enter a keyword");
      return;
    }

    try {
      await userKeywordService.create(newKeyword.trim());
      setNewKeyword("");
      toast.success("Keyword added successfully");
      await loadUserKeywords();
    } catch (error) {
      console.error("Error adding keyword:", error);
      toast.error("Failed to add keyword");
    }
  };

  const addPresetKeyword = async (keyword: string) => {
    const existingKeywords = userKeywords.map((k) => k.keyword.toLowerCase());
    if (!existingKeywords.includes(keyword.toLowerCase())) {
      try {
        await userKeywordService.create(keyword);
        toast.success(`Added "${keyword}"`);
        await loadUserKeywords();
      } catch (error) {
        console.error("Error adding preset keyword:", error);
        toast.error("Failed to add keyword");
      }
    }
  };

  // Filter keywords from both categories based on input and exclude already added keywords
  const existingKeywords = userKeywords.map((k) => k.keyword.toLowerCase());
  const filteredTechnicalSkills = TECHNICAL_SKILLS.filter(
    (keyword) =>
      keyword.toLowerCase().includes(newKeyword.toLowerCase()) &&
      !existingKeywords.includes(keyword.toLowerCase())
  ).slice(0, 8); // Limit to 8 suggestions per category

  const filteredSoftSkills = SOFT_SKILLS.filter(
    (keyword) =>
      keyword.toLowerCase().includes(newKeyword.toLowerCase()) &&
      !existingKeywords.includes(keyword.toLowerCase())
  ).slice(0, 8); // Limit to 8 suggestions per category

  const handleDeleteKeyword = async (id: number) => {
    try {
      await userKeywordService.delete(id);
      toast.success("Keyword deleted successfully");
      await loadUserKeywords();
    } catch (error) {
      console.error("Error deleting keyword:", error);
      toast.error("Failed to delete keyword");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (viewMode === "user") {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Manage Your Keywords
            </CardTitle>
            <CardDescription>
              Add keywords for skills that you currently have from your resume
              or other professional profiles.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left column: Input and preset keywords */}
              <div className="space-y-4">
                {/* Add keyword form */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor="new-keyword" className="pb-2">
                      Add New Keyword
                    </Label>
                    <Input
                      id="new-keyword"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Enter keyword or search suggestions"
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleAddKeyword()
                      }
                    />
                  </div>
                  <Button onClick={handleAddKeyword}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Keyword suggestions based on search */}
                {newKeyword.length > 0 &&
                  (filteredTechnicalSkills.length > 0 ||
                    filteredSoftSkills.length > 0) && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Suggestions:
                      </Label>

                      {filteredTechnicalSkills.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Technical Skills
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {filteredTechnicalSkills.map((keyword) => (
                              <Badge
                                key={keyword}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-colors"
                                onClick={() => addPresetKeyword(keyword)}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {filteredSoftSkills.length > 0 && (
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-green-600 dark:text-green-400">
                            Soft Skills
                          </Label>
                          <div className="flex flex-wrap gap-1">
                            {filteredSoftSkills.map((keyword) => (
                              <Badge
                                key={keyword}
                                variant="outline"
                                className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800 transition-colors"
                                onClick={() => addPresetKeyword(keyword)}
                              >
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Show categorized keywords when no input */}
                {newKeyword.length === 0 && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-muted-foreground">
                      Select from categories:
                    </Label>

                    {/* Technical Skills */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-blue-600 dark:text-blue-400">
                        Technical Skills
                      </Label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {TECHNICAL_SKILLS.filter(
                          (keyword) =>
                            !existingKeywords.includes(keyword.toLowerCase())
                        )
                          .slice(0, 15)
                          .map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="outline"
                              className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 transition-colors"
                              onClick={() => addPresetKeyword(keyword)}
                            >
                              {keyword}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    {/* Soft Skills */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-green-600 dark:text-green-400">
                        Soft Skills
                      </Label>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {SOFT_SKILLS.filter(
                          (keyword) =>
                            !existingKeywords.includes(keyword.toLowerCase())
                        )
                          .slice(0, 15)
                          .map((keyword) => (
                            <Badge
                              key={keyword}
                              variant="outline"
                              className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 border-green-200 dark:border-green-800 transition-colors"
                              onClick={() => addPresetKeyword(keyword)}
                            >
                              {keyword}
                            </Badge>
                          ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right column: Added keywords */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Your Keywords ({userKeywords.length}):
                </Label>
                {userKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                    {userKeywords.map((keyword) => (
                      <Badge
                        key={keyword.id}
                        variant="secondary"
                        className="text-sm py-1 px-3 flex items-center gap-2"
                      >
                        {keyword.keyword}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleDeleteKeyword(keyword.id!)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8 border rounded-md">
                    No keywords added yet. Select from categories or search
                    above.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Application view (existing functionality)
  const currentStats =
    applicationViewMode === "popular" ? popularStats : missingSkillsStats;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant={applicationViewMode === "popular" ? "default" : "outline"}
          size="sm"
          onClick={() => setApplicationViewMode("popular")}
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          Popular
        </Button>
        <Button
          variant={applicationViewMode === "missing" ? "default" : "outline"}
          size="sm"
          onClick={() => setApplicationViewMode("missing")}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Missing Skills
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {applicationViewMode === "popular"
              ? "Popular Keywords"
              : "Targeted Keywords (Weighted by Interest)"}
          </CardTitle>
          <CardDescription>
            {applicationViewMode === "popular"
              ? "Keywords that appear most frequently across all your job applications."
              : "Keywords ranked by frequency and your interest level in the jobs."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No keyword data available. Add some job applications with keywords
              to see statistics.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-medium text-muted-foreground border-b pb-2">
                <div>Keyword</div>
                <div>Jobs</div>
                <div>
                  {applicationViewMode === "popular"
                    ? "Total Mentions"
                    : "Weighted Score"}
                </div>
              </div>
              <div className="space-y-2">
                {currentStats.map((stat, index) => (
                  <div
                    key={stat.keyword}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center py-2 border-b border-muted last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <Badge variant="outline" className="text-sm">
                        {stat.keyword}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      {stat.jobCount} job{stat.jobCount !== 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-2">
                      {applicationViewMode === "popular" ? (
                        <span className="text-sm font-medium">
                          {stat.totalCount}
                        </span>
                      ) : (
                        <span className="text-sm font-medium">
                          {(stat as WeightedKeywordStat).weightedScore.toFixed(
                            1
                          )}
                        </span>
                      )}
                      <div
                        className={`h-2 rounded-full ${
                          applicationViewMode === "popular"
                            ? "bg-blue-200 dark:bg-blue-800"
                            : "bg-green-200 dark:bg-green-800"
                        }`}
                        style={{
                          width: `${Math.min(
                            applicationViewMode === "popular"
                              ? (stat.totalCount /
                                  Math.max(
                                    ...currentStats.map((s) => s.totalCount)
                                  )) *
                                  100
                              : ((stat as WeightedKeywordStat).weightedScore /
                                  Math.max(
                                    ...(
                                      currentStats as WeightedKeywordStat[]
                                    ).map((s) => s.weightedScore)
                                  )) *
                                  100,
                            100
                          )}%`,
                          minWidth: "4px",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
