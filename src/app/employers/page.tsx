"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { employerService, jobService } from "@/lib/db-services";
import { Employer, Job } from "@/lib/database";
import { Search, Building2, Briefcase, Calendar, Star } from "lucide-react";
import { DateTime } from "luxon";

interface EmployerWithStats extends Employer {
  jobCount: number;
  appliedCount: number;
  favoritesCount: number;
  statusCounts: Record<string, number>;
  latestActivity: Date | null;
}

export default function EmployersPage() {
  const [employers, setEmployers] = useState<EmployerWithStats[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employersData, jobsData] = await Promise.all([
        employerService.getAll(),
        jobService.getAllIncludingArchived(),
      ]);

      // Calculate stats for each employer
      const employersWithStats: EmployerWithStats[] = employersData.map(
        (employer) => {
          const employerJobs = jobsData.filter(
            (job) => job.employerId === employer.id
          );
          const appliedJobs = employerJobs.filter(
            (job) => job.status !== "not applied"
          );
          const favoritedJobs = employerJobs.filter((job) => job.favorited);

          // Count jobs by status
          const statusCounts: Record<string, number> = {};
          employerJobs.forEach((job) => {
            statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
          });

          // Find latest activity (most recent job creation or update)
          const latestActivity = employerJobs.reduce<Date | null>(
            (latest, job) => {
              const jobLatest =
                job.updatedAt > job.createdAt ? job.updatedAt : job.createdAt;
              if (!latest || jobLatest > latest) {
                return jobLatest;
              }
              return latest;
            },
            null
          );

          return {
            ...employer,
            jobCount: employerJobs.length,
            appliedCount: appliedJobs.length,
            favoritesCount: favoritedJobs.length,
            statusCounts,
            latestActivity,
          };
        }
      );

      setEmployers(employersWithStats);
      setJobs(jobsData);
    } catch (error) {
      console.error("Error loading employers data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (employerId: number) => {
    try {
      await employerService.toggleFavorite(employerId);
      toast.success("Employer favorite updated");
      await loadData();
    } catch (error) {
      console.error("Error toggling employer favorite:", error);
      toast.error("Failed to update favorite", {
        description: "Please try again.",
      });
    }
  };

  const filteredEmployers = useMemo(() => {
    let result = employers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = employers.filter(
        (employer) =>
          employer.name.toLowerCase().includes(term) ||
          (employer.notes?.toLowerCase().includes(term) ?? false)
      );
    }

    // Sort: favorites first, then by name
    return result.sort((a, b) => {
      if (a.favorited && !b.favorited) return -1;
      if (!a.favorited && b.favorited) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [employers, searchTerm]);

  const getStatusBadgeColor = (status: string) => {
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
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
    }
  };

  const formatStatusLabel = (status: string) => {
    return status
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Employers</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Employers</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {employers.length} employers
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            {employers.filter((e) => e.favorited).length} favorites
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            {jobs.length} total applications
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employer Directory</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employers by name or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No employers found matching your search."
                : "No employers found."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">⭐</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status Breakdown</TableHead>
                    <TableHead>Last Activity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployers.map((employer) => (
                    <TableRow key={employer.id}>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(employer.id!)}
                          className="h-8 w-8 p-0 hover:bg-transparent"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              employer.favorited
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-400 hover:text-yellow-400"
                            }`}
                          />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{employer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {employer.industry || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(employer.statusCounts).map(
                            ([status, count]) => (
                              <Badge
                                key={status}
                                variant="outline"
                                className={`text-xs ${getStatusBadgeColor(
                                  status
                                )}`}
                              >
                                {formatStatusLabel(status)}: {count}
                              </Badge>
                            )
                          )}
                          {employer.favoritesCount > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-yellow-600 border-yellow-600"
                            >
                              ⭐ {employer.favoritesCount}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {employer.latestActivity ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {DateTime.fromJSDate(
                              employer.latestActivity
                            ).toFormat("MMM d, yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No activity
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
