"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobUpdateDialog } from "@/components/JobUpdateDialog";
import { jobService, keywordService } from "@/lib/db-services";
import { Job, Keyword, Employer } from "@/lib/database";
import { Trash2, Calendar, Building } from "lucide-react";

interface JobWithEmployer extends Job {
  employer: Employer;
}

interface JobWithKeywords extends JobWithEmployer {
  keywords: Keyword[];
}

export function JobsList() {
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
      <h2 className="text-2xl font-bold">Job Applications</h2>
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-zinc-500" />
                  {job.employer.name}
                </CardTitle>
                {job.employer.notes && (
                  <p className="text-sm text-zinc-600 italic">
                    {job.employer.notes}
                  </p>
                )}
                <CardDescription className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  {job.title}
                </CardDescription>
                {job.notes && (
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                    {job.notes}
                  </p>
                )}
                {job.link && (
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    🔗 View Job Posting
                  </a>
                )}
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Applied: {new Date(job.appliedDate).toLocaleDateString()}
                  </div>
                  <Badge className={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <JobUpdateDialog job={job} onJobUpdated={loadJobs} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteJob(job.id!)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {job.keywords.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
                  Keywords:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.keywords
                    .sort((a, b) => a.keyword.localeCompare(b.keyword))
                    .map((keyword) => (
                      <Badge
                        key={keyword.id}
                        variant="secondary"
                        className="capitalize"
                      >
                        {keyword.keyword}
                      </Badge>
                    ))}
                </div>
                <div className="text-sm text-zinc-500 mt-2">
                  Total keywords: {job.keywords.length}
                </div>
              </div>
            ) : (
              <div className="text-zinc-500 text-sm">No keywords added yet</div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
