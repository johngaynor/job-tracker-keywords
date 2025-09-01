"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { employerService, jobService } from "@/lib/db-services";
import { Employer, Industry } from "@/lib/database";
import {
  Search,
  Building2,
  Calendar,
  Star,
  Eye,
  Edit,
  AlertTriangle,
  Trash,
  Plus,
} from "lucide-react";
import { DateTime } from "luxon";

const INDUSTRY_OPTIONS: Industry[] = [
  "Agriculture",
  "Biotech",
  "Consulting",
  "Cybersecurity",
  "Defense",
  "E-Commerce",
  "Education",
  "Energy",
  "Finance",
  "Gaming",
  "Government",
  "Healthcare",
  "Manufacturing",
  "Nonprofit",
  "Other",
  "Real Estate",
  "SaaS",
  "Telecommunications",
  "Transportation",
  "Travel",
];

interface EmployerWithStats extends Employer {
  jobCount: number;
  appliedCount: number;
  favoritesCount: number;
  statusCounts: Record<string, number>;
  latestActivity: Date | null;
}

export default function EmployersPage() {
  const [employers, setEmployers] = useState<EmployerWithStats[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] = useState<"alphabetical" | "favorites">(
    "favorites"
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmployer, setSelectedEmployer] =
    useState<EmployerWithStats | null>(null);
  const [editFormData, setEditFormData] = useState({
    industry: "",
    notes: "",
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: "",
    industry: "",
    notes: "",
    favorite: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleViewEmployer = (employer: EmployerWithStats) => {
    setSelectedEmployer(employer);
    setViewDialogOpen(true);
  };

  const handleEditEmployer = (employer: EmployerWithStats) => {
    setSelectedEmployer(employer);
    setEditFormData({
      industry: employer.industry || "",
      notes: employer.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleUpdateEmployer = async () => {
    if (!selectedEmployer || !selectedEmployer.id) return;

    try {
      await employerService.update(selectedEmployer.id, {
        industry: (editFormData.industry as Industry) || undefined,
        notes: editFormData.notes || undefined,
      });
      toast.success("Employer updated successfully");
      setEditDialogOpen(false);
      setSelectedEmployer(null);
      await loadData();
    } catch (error) {
      console.error("Error updating employer:", error);
      toast.error("Failed to update employer", {
        description: "Please try again.",
      });
    }
  };

  const handleDeleteEmployer = async (employer: EmployerWithStats) => {
    if (!employer.id) return;

    // Check if employer has any jobs
    if (employer.jobCount > 0) {
      toast.error("Cannot delete employer", {
        description: `This employer has ${employer.jobCount} job application(s). Please delete them first.`,
      });
      return;
    }

    // Confirm deletion
    if (
      !confirm(
        `Are you sure you want to delete "${employer.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await employerService.delete(employer.id);
      toast.success("Employer deleted successfully");
      await loadData();
    } catch (error) {
      console.error("Error deleting employer:", error);
      toast.error("Failed to delete employer", {
        description: "Please try again.",
      });
    }
  };

  const handleCreateEmployer = async () => {
    if (!createFormData.name.trim()) {
      toast.error("Please enter an employer name");
      return;
    }

    try {
      await employerService.create(
        createFormData.name.trim(),
        createFormData.notes.trim() || undefined,
        (createFormData.industry as Industry) || undefined,
        createFormData.favorite
      );
      toast.success("Employer created successfully");
      setCreateDialogOpen(false);
      setCreateFormData({
        name: "",
        industry: "",
        notes: "",
        favorite: false,
      });
      await loadData();
    } catch (error) {
      console.error("Error creating employer:", error);
      toast.error("Failed to create employer", {
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

    // Sort based on selected sort option
    return result.sort((a, b) => {
      // Always prioritize companies missing industry (no industry field)
      const aHasIndustry = !!a.industry;
      const bHasIndustry = !!b.industry;

      if (!aHasIndustry && bHasIndustry) return -1;
      if (aHasIndustry && !bHasIndustry) return 1;

      if (sortBy === "favorites") {
        // Within same industry status, sort by favorites then alphabetically
        if (a.favorited && !b.favorited) return -1;
        if (!a.favorited && b.favorited) return 1;
      }

      // Finally sort alphabetically
      return a.name.localeCompare(b.name);
    });
  }, [employers, searchTerm, sortBy]);

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

  // Prevent hydration mismatch by not showing loading state on server
  if (!mounted || loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>

        {/* Main card skeleton */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <Skeleton className="h-6 w-40" />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Skeleton className="h-10 w-full sm:w-36" />
                <Skeleton className="h-10 w-full sm:w-48" />
              </div>
            </div>
            <div className="relative mt-4">
              <Skeleton className="h-10 w-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-center">⭐</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status Breakdown</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Generate 8 skeleton rows */}
                  {Array.from({ length: 8 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-center">
                        <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Skeleton className="h-5 w-8 rounded-full" />
                          <Skeleton className="h-5 w-8 rounded-full" />
                          <Skeleton className="h-5 w-8 rounded-full" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Employer Directory</CardTitle>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Employer
              </Button>
              <Select
                value={sortBy}
                onValueChange={(value: "alphabetical" | "favorites") =>
                  setSortBy(value)
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical A-Z</SelectItem>
                  <SelectItem value="favorites">Favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                    <TableHead className="w-[160px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployers.map((employer) => (
                    <TableRow
                      key={employer.id}
                      className={
                        !employer.industry ? "bg-red-50 dark:bg-red-950/20" : ""
                      }
                    >
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
                      <TableCell>
                        <div className="flex gap-1">
                          {!employer.industry && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                  >
                                    <AlertTriangle className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Missing information</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewEmployer(employer)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployer(employer)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployer(employer)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Employer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Employer Details</DialogTitle>
          </DialogHeader>
          {selectedEmployer && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Company Name</Label>
                <div className="mt-1 text-sm">{selectedEmployer.name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Industry</Label>
                <div className="mt-1 text-sm">
                  {selectedEmployer.industry || "Not specified"}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Jobs</Label>
                <div className="mt-1 text-sm">
                  {selectedEmployer.jobCount} total,{" "}
                  {selectedEmployer.appliedCount} applied
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <div className="mt-1 text-sm">
                  {selectedEmployer.notes || "No notes"}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Activity</Label>
                <div className="mt-1 text-sm">
                  {selectedEmployer.latestActivity
                    ? DateTime.fromJSDate(
                        selectedEmployer.latestActivity
                      ).toFormat("MMM d, yyyy")
                    : "No activity"}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employer</DialogTitle>
          </DialogHeader>
          {selectedEmployer && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Company Name</Label>
                <div className="mt-1 text-sm text-muted-foreground">
                  {selectedEmployer.name} (read-only)
                </div>
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={editFormData.industry || "none"}
                  onValueChange={(value) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      industry: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No industry</SelectItem>
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editFormData.notes}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Add notes about this employer..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateEmployer}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Employer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Employer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employerName">Company Name</Label>
                <Input
                  id="employerName"
                  value={createFormData.name}
                  onChange={(e) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter company name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerIndustry">Industry</Label>
                <Select
                  value={createFormData.industry || "none"}
                  onValueChange={(value) =>
                    setCreateFormData((prev) => ({
                      ...prev,
                      industry: value === "none" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No industry</SelectItem>
                    {INDUSTRY_OPTIONS.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Favorite?</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={createFormData.favorite ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setCreateFormData((prev) => ({ ...prev, favorite: true }))
                  }
                  className="flex items-center gap-1"
                >
                  <Star
                    className={`h-4 w-4 ${
                      createFormData.favorite ? "fill-current" : ""
                    }`}
                  />
                  Favorite
                </Button>
                <Button
                  type="button"
                  variant={!createFormData.favorite ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    setCreateFormData((prev) => ({ ...prev, favorite: false }))
                  }
                  className="flex items-center gap-1"
                >
                  <Star className="h-4 w-4" />
                  Normal
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employerNotes">Notes</Label>
              <Textarea
                id="employerNotes"
                value={createFormData.notes}
                onChange={(e) =>
                  setCreateFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Add notes about this employer..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateEmployer}>Create Employer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
