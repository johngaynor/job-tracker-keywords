"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Job, Keyword } from "@/lib/database";
import {
  Eye,
  Building,
  Calendar,
  Link,
  FileText,
  DollarSign,
  Star,
  Hash,
} from "lucide-react";

interface JobViewDialogProps {
  job: Job & { employer: { name: string; notes?: string }; keywords: Keyword[] };
}

export function JobViewDialog({ job }: JobViewDialogProps) {
  const [open, setOpen] = useState(false);

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
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
    }
  };

  const getInterestLevelColor = (level: number) => {
    if (level <= 3) return "text-red-600 dark:text-red-400";
    if (level <= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getInterestLevelEmoji = (level: number) => {
    if (level <= 3) return "🔴";
    if (level <= 6) return "🟡";
    return "🟢";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Job Details
          </DialogTitle>
          <DialogDescription>
            Complete information for {job.employer.name} - {job.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Company
                  </label>
                  <p className="font-medium">{job.employer.name}</p>
                  {job.employer.notes && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic mt-1">
                      {job.employer.notes}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Position
                  </label>
                  <p className="font-medium">{job.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Status
                  </label>
                  <div>
                    <Badge className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Created
                  </label>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-zinc-500" />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Additional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.referenceNumber && (
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Reference Number
                    </label>
                    <div className="flex items-center gap-1">
                      <Hash className="h-4 w-4 text-zinc-500" />
                      <span className="font-mono text-sm">{job.referenceNumber}</span>
                    </div>
                  </div>
                )}
                {job.salaryEstimate && (
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Salary Estimate
                    </label>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-zinc-500" />
                      <span className="font-medium">{job.salaryEstimate}</span>
                    </div>
                  </div>
                )}
                {job.interestLevel && (
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Interest Level
                    </label>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-zinc-500" />
                      <span className={`font-medium ${getInterestLevelColor(job.interestLevel)}`}>
                        {getInterestLevelEmoji(job.interestLevel)} {job.interestLevel}/10
                      </span>
                    </div>
                  </div>
                )}
                {job.link && (
                  <div>
                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Job Posting
                    </label>
                    <div>
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        <Link className="h-4 w-4" />
                        View Original Posting
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              {job.notes && (
                <div>
                  <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    Notes
                  </label>
                  <div className="mt-1 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{job.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keywords/Skills */}
          {job.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Skills & Keywords ({job.keywords.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
