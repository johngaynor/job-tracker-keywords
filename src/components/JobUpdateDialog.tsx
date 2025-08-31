"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { jobService, activityService } from "@/lib/db-services";
import { Job } from "@/lib/database";
import { Edit, Calendar, MessageSquare } from "lucide-react";

interface JobUpdateDialogProps {
  job: Job;
  onJobUpdated: () => void;
}

const STATUS_OPTIONS = [
  { value: "not applied", label: "Not Applied" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
];

const ACTIVITY_TYPES = [
  { value: "linkedin_outreach", label: "LinkedIn Outreach" },
  { value: "email_sent", label: "Email Sent" },
  { value: "phone_call_scheduled", label: "Phone Call Scheduled" },
  { value: "phone_call_completed", label: "Phone Call Completed" },
  { value: "follow_up_sent", label: "Follow Up Sent" },
  { value: "reference_check", label: "Reference Check" },
  { value: "networking_event", label: "Networking Event" },
  { value: "informational_interview", label: "Informational Interview" },
  { value: "research_completed", label: "Company Research" },
  { value: "contact_made", label: "Contact Made" },
  { value: "other", label: "Other" },
];

export function JobUpdateDialog({ job, onJobUpdated }: JobUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status change tab
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [statusNotes, setStatusNotes] = useState("");

  // Activity tab
  const [selectedActivity, setSelectedActivity] = useState<string>("");
  const [activityNotes, setActivityNotes] = useState("");

  const currentStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === job.status)?.label || job.status;

  const handleStatusChange = async () => {
    if (!selectedStatus || selectedStatus === job.status) {
      toast.error("Please select a different status");
      return;
    }

    setIsSubmitting(true);
    try {
      // Update job status
      await jobService.update(job.id!, { status: selectedStatus as any });

      // Log status change activity
      await activityService.create(
        job.id!,
        "status_change",
        selectedStatus,
        statusNotes.trim() || undefined,
        job.status,
        selectedStatus
      );

      toast.success("Status updated successfully!", {
        description: `Changed from ${currentStatusLabel} to ${
          STATUS_OPTIONS.find((s) => s.value === selectedStatus)?.label
        }`,
      });

      // Reset form
      setSelectedStatus("");
      setStatusNotes("");
      setOpen(false);
      onJobUpdated();
    } catch (error) {
      console.error("Error updating job status:", error);
      toast.error("Failed to update status", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivityAdd = async () => {
    if (!selectedActivity) {
      toast.error("Please select an activity type");
      return;
    }

    setIsSubmitting(true);
    try {
      // Log activity
      await activityService.create(
        job.id!,
        "activity",
        selectedActivity,
        activityNotes.trim() || undefined
      );

      toast.success("Activity logged successfully!", {
        description: ACTIVITY_TYPES.find((a) => a.value === selectedActivity)
          ?.label,
      });

      // Reset form
      setSelectedActivity("");
      setActivityNotes("");
      setOpen(false);
      onJobUpdated();
    } catch (error) {
      console.error("Error logging activity:", error);
      toast.error("Failed to log activity", {
        description: "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Update Job Application
          </DialogTitle>
          <DialogDescription>
            Update the status or log activity for &quot;{job.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Status Change
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Log Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem
                      key={status.value}
                      value={status.value}
                      disabled={status.value === job.status}
                    >
                      {status.label}
                      {status.value === job.status && " (Current)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-notes">Notes (optional)</Label>
              <Textarea
                id="status-notes"
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="Add notes about this status change..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleStatusChange}
              disabled={
                isSubmitting || !selectedStatus || selectedStatus === job.status
              }
              className="w-full"
            >
              {isSubmitting ? "Updating..." : "Update Status"}
            </Button>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="activity-type">Activity Type</Label>
              <Select
                value={selectedActivity}
                onValueChange={setSelectedActivity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      {activity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-notes">Notes (optional)</Label>
              <Textarea
                id="activity-notes"
                value={activityNotes}
                onChange={(e) => setActivityNotes(e.target.value)}
                placeholder="Add details about this activity..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleActivityAdd}
              disabled={isSubmitting || !selectedActivity}
              className="w-full"
            >
              {isSubmitting ? "Logging..." : "Log Activity"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
