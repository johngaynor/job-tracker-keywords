"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { activityService } from "@/lib/db-services";
import { Activity } from "@/lib/database";
import { FileText, Calendar, ArrowUpDown } from "lucide-react";

interface ActivityLogDialogProps {
  jobId: number;
  jobTitle: string;
}

export function ActivityLogDialog({ jobId, jobTitle }: ActivityLogDialogProps) {
  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  const loadActivities = async () => {
    if (!open) return;

    setLoading(true);
    try {
      const jobActivities = await activityService.getByJobId(jobId);
      setActivities(jobActivities);
    } catch (error) {
      console.error("Error loading activities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [open, jobId, loadActivities]);

  const getActivityTypeColor = (type: string) => {
    switch (type) {
      case "status_change":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "activity":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";
    }
  };

  const formatActivityCategory = (category: string) => {
    return category
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <FileText className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Log
          </DialogTitle>
          <DialogDescription>
            Activity history for &quot;{jobTitle}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-zinc-500">
                Loading activities...
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center text-zinc-500">
                No activities recorded yet.
              </div>
            </div>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-zinc-500" />
                          <span className="whitespace-nowrap">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {new Date(activity.createdAt).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getActivityTypeColor(activity.type)}
                          variant="secondary"
                        >
                          {activity.type === "status_change"
                            ? "Status"
                            : "Activity"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatActivityCategory(activity.category)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {activity.type === "status_change" &&
                        activity.previousStatus &&
                        activity.newStatus ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {activity.previousStatus}
                            </Badge>
                            <ArrowUpDown className="h-3 w-3 text-zinc-500" />
                            <Badge variant="outline" className="text-xs">
                              {activity.newStatus}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activity.notes ? (
                          <p
                            className="text-sm max-w-xs"
                            title={activity.notes}
                          >
                            {activity.notes}
                          </p>
                        ) : (
                          <span className="text-zinc-500 text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
