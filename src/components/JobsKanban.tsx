"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobUpdateDialog } from "@/components/JobUpdateDialog";
import { ActivityLogDialog } from "@/components/ActivityLogDialog";
import { JobViewDialog } from "@/components/JobViewDialog";
import { jobService, keywordService } from "@/lib/db-services";
import { Job, Keyword, Employer } from "@/lib/database";
import { Trash2, Calendar, Building } from "lucide-react";

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

export function JobsKanban() {
  const [jobs, setJobs] = useState<JobWithKeywords[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    try {
      const jobsWithEmployers = await jobService.getJobsWithEmployers();
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
  };

  useEffect(() => {
    loadJobs();
  }, []);

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

  const getJobsByStatus = (status: string) => {
    return jobs.filter((job) => job.status === status);
  };

  if (loading) {
    return <div className="text-center py-8">Loading jobs...</div>;
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-zinc-500">
            No job applications yet. Add your first job application above!
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
                  <Card key={job.id} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3 text-zinc-500 flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {job.employer.name}
                            </span>
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
                        <div className="flex flex-col gap-1 ml-2">
                          <JobViewDialog job={job} />
                          <ActivityLogDialog
                            job={job}
                          />
                          <JobUpdateDialog job={job} onJobUpdated={loadJobs} />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDeleteJob(job.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
