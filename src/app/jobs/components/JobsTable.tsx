"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobUpdateDialog } from "./JobUpdateDialog";
import { ActivityLogDialog } from "./ActivityLogDialog";
import { jobService, keywordService, employerService } from "@/lib/db-services";
import { Job, Keyword, Employer } from "@/lib/database";
import { Trash2, Calendar, Building, ExternalLink, Star } from "lucide-react";

interface JobWithEmployer extends Job {
  employer: Employer;
}

interface JobWithKeywords extends JobWithEmployer {
  keywords: Keyword[];
}

interface JobsTableProps {
  showArchived: boolean;
}

export function JobsTable({ showArchived }: JobsTableProps) {
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

      // Sort jobs: favorites first, then by creation date (newest first)
      jobsWithKeywords.sort((a, b) => {
        if (a.favorited && !b.favorited) return -1;
        if (!a.favorited && b.favorited) return 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setJobs(jobsWithKeywords);
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not applied":
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
      case "applied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "interview":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "offer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "withdrawn":
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">⭐</TableHead>
              <TableHead className="w-[250px]">Position</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Keywords</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Generate skeleton rows */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4].map((j) => (
                      <div
                        key={j}
                        className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-12"
                      ></div>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No job applications yet. Add your first job application above!
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">⭐</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Salary</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead>Keywords</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Link</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id}>
              <TableCell>
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
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-zinc-500" />
                    <span className="font-medium">{job.employer.name}</span>
                  </div>
                  {job.employer.notes && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                      {job.employer.notes}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium">{job.title}</p>
                  {job.notes && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                      {job.notes}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {job.salaryEstimate ? (
                  <p className="text-sm font-medium">{job.salaryEstimate}</p>
                ) : (
                  <span className="text-zinc-500 text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {job.interestLevel ? (
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{job.interestLevel}</span>
                    <span>
                      {job.interestLevel <= 3
                        ? "🔴"
                        : job.interestLevel <= 6
                        ? "🟡"
                        : "🟢"}
                    </span>
                  </div>
                ) : (
                  <span className="text-zinc-500 text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4 text-zinc-500" />
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </TableCell>
              <TableCell>
                {job.keywords.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {job.keywords
                        .sort((a, b) => a.keyword.localeCompare(b.keyword))
                        .slice(0, 3)
                        .map((keyword) => (
                          <Badge
                            key={keyword.id}
                            variant="secondary"
                            className="capitalize text-xs"
                          >
                            {keyword.keyword}
                          </Badge>
                        ))}
                      {job.keywords.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{job.keywords.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Total: {job.keywords.length}
                    </div>
                  </div>
                ) : (
                  <span className="text-zinc-500 text-sm">No keywords</span>
                )}
              </TableCell>
              <TableCell>
                {job.notes ? (
                  <p className="text-sm max-w-xs truncate" title={job.notes}>
                    {job.notes}
                  </p>
                ) : (
                  <span className="text-zinc-500 text-sm">-</span>
                )}
              </TableCell>
              <TableCell>
                {job.link ? (
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View Job Posting</span>
                  </a>
                ) : (
                  <span className="text-zinc-500 text-sm">-</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <ActivityLogDialog job={job} />
                  <JobUpdateDialog job={job} onJobUpdated={loadJobs} />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteJob(job.id!)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
