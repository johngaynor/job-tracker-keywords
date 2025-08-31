"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobUpdateDialog } from "./JobUpdateDialog";
import { ActivityLogDialog } from "./ActivityLogDialog";
import { JobViewDialog } from "./JobViewDialog";
import { jobService, keywordService, employerService } from "@/lib/db-services";
import { Job, Keyword, Employer } from "@/lib/database";
import {
  Trash2,
  Calendar,
  Building,
  MoreVertical,
  Eye,
  FileText,
  Edit,
  Archive,
  ArchiveRestore,
  Star,
} from "lucide-react";

interface JobWithEmployer extends Job {
  employer: Employer;
}

interface JobWithKeywords extends JobWithEmployer {
  keywords: Keyword[];
}

const STATUS_COLUMNS = [
  {
    id: "not applied",
    title: "Not Applied",
    color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
  {
    id: "applied",
    title: "Applied",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  {
    id: "interview",
    title: "Interview",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  },
  {
    id: "rejected",
    title: "Rejected",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
  {
    id: "offer",
    title: "Offer",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  {
    id: "withdrawn",
    title: "Withdrawn",
    color: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
];

interface JobsKanbanProps {
  showArchived: boolean;
}

export function JobsKanban({ showArchived }: JobsKanbanProps) {
  const [jobs, setJobs] = useState<JobWithKeywords[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    try {
      const jobsWithEmployers = showArchived
        ? await jobService.getAllIncludingArchived().then(async (allJobs) => {
            const result: (Job & { employer: Employer })[] = [];
            for (const job of allJobs) {
              const employer = await employerService.getById(job.employerId);
              if (employer) {
                result.push({ ...job, employer });
              }
            }
            return result;
          })
        : await jobService.getJobsWithEmployers();

      const jobsWithKeywords: JobWithKeywords[] = [];

      for (const job of jobsWithEmployers) {
        const keywords = await keywordService.getByJobId(job.id!);
        jobsWithKeywords.push({ ...job, keywords });
      }

      setJobs(jobsWithKeywords);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    loadJobs();
  }, [showArchived, loadJobs]);

  const handleDeleteJob = async (jobId: number) => {
    if (confirm("Are you sure you want to delete this job application?")) {
      try {
        await jobService.delete(jobId);
        toast.success("Job application deleted successfully");
        await loadJobs();
      } catch (error) {
        console.error("Error deleting job:", error);
        toast.error("Failed to delete job application", {
          description: "Please try again.",
        });
      }
    }
  };

  const handleToggleArchive = async (jobId: number) => {
    try {
      await jobService.toggleArchive(jobId);
      const job = jobs.find((j) => j.id === jobId);
      const isArchiving = !job?.archived;
      toast.success(
        `Job ${isArchiving ? "archived" : "unarchived"} successfully`
      );
      await loadJobs();
    } catch (error) {
      console.error("Error toggling archive status:", error);
      toast.error("Failed to update archive status");
    }
  };

  const handleToggleFavorite = async (jobId: number) => {
    try {
      await jobService.toggleFavorite(jobId);
      toast.success("Favorite updated");
      await loadJobs();
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Failed to update favorite", {
        description: "Please try again.",
      });
    }
  };

  const getJobsByStatus = (status: string) => {
    return jobs
      .filter((job) => job.status === status)
      .sort((a, b) => {
        // Sort favorites first, then by creation date (newest first)
        if (a.favorited && !b.favorited) return -1;
        if (!a.favorited && b.favorited) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Skeleton for each status column */}
        {[
          "Not Applied",
          "Applied",
          "Interview",
          "Offer",
          "Rejected",
          "Withdrawn",
        ].map((status) => (
          <div key={status} className="space-y-3">
            {/* Column header skeleton */}
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>

            {/* Job card skeletons */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 space-y-3">
                  {/* Job title skeleton */}
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>

                  {/* Company name skeleton */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>

                  {/* Interest level skeleton */}
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>

                  {/* Keywords skeleton */}
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3].map((j) => (
                      <div
                        key={j}
                        className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16"
                      ></div>
                    ))}
                  </div>

                  {/* Actions skeleton */}
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-zinc-500">
            {showArchived
              ? "No job applications yet (including archived). Add your first job application above!"
              : "No active job applications. Add your first job application above or check 'Show archived jobs' to see archived ones!"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {STATUS_COLUMNS.map((column) => {
          const columnJobs = getJobsByStatus(column.id);
          return (
            <div key={column.id} className="space-y-3">
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${column.color}`}
              >
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <Badge
                  variant="outline"
                  className="text-xs bg-white/20 border-white/30"
                >
                  {columnJobs.length}
                </Badge>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {columnJobs.map((job) => (
                  <Card
                    key={job.id}
                    className={`p-3 ${
                      job.archived
                        ? "bg-zinc-50 dark:bg-zinc-900 border-dashed opacity-70"
                        : ""
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {job.employer.name}
                            </span>
                            {job.archived && (
                              <Badge
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                Archived
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-zinc-900 dark:text-zinc-100 font-medium truncate">
                            {job.title}
                          </p>
                          {job.notes && (
                            <p
                              className="text-xs text-zinc-600 dark:text-zinc-400 italic overflow-hidden"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                              }}
                            >
                              {job.notes}
                            </p>
                          )}
                          {job.salaryEstimate && (
                            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                              💰 {job.salaryEstimate}
                            </p>
                          )}
                          {job.interestLevel && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              {job.interestLevel <= 3
                                ? "🔴"
                                : job.interestLevel <= 6
                                ? "🟡"
                                : "🟢"}{" "}
                              Interest: {job.interestLevel}/10
                            </p>
                          )}
                          {job.link && (
                            <a
                              href={job.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
                            >
                              🔗 View Posting
                            </a>
                          )}
                          <div className="flex items-center gap-1 text-xs text-zinc-500">
                            <Calendar className="h-3 w-3" />
                            {new Date(job.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="ml-2 flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleFavorite(job.id!)}
                            className="h-8 w-8 p-0 hover:bg-transparent"
                          >
                            <Star
                              className={`h-4 w-4 ${
                                job.favorited
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-400 hover:text-yellow-400"
                              }`}
                            />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <JobViewDialog job={job}>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                              </JobViewDialog>

                              <ActivityLogDialog job={job}>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Activity Log
                                </DropdownMenuItem>
                              </ActivityLogDialog>

                              <JobUpdateDialog
                                job={job}
                                onJobUpdated={loadJobs}
                              >
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Update Status
                                </DropdownMenuItem>
                              </JobUpdateDialog>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => handleToggleArchive(job.id!)}
                              >
                                {job.archived ? (
                                  <>
                                    <ArchiveRestore className="h-4 w-4 mr-2" />
                                    Unarchive
                                  </>
                                ) : (
                                  <>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onSelect={() => handleDeleteJob(job.id!)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {job.keywords.length > 0 && (
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1">
                            {job.keywords
                              .slice(0, 3)
                              .sort((a, b) =>
                                a.keyword.localeCompare(b.keyword)
                              )
                              .map((keyword) => (
                                <Badge
                                  key={keyword.id}
                                  variant="secondary"
                                  className="text-xs px-1 py-0"
                                >
                                  {keyword.keyword}
                                </Badge>
                              ))}
                            {job.keywords.length > 3 && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-1 py-0"
                              >
                                +{job.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
