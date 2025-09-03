"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { employerActivityService } from "@/lib/db-services";
import { Employer, EmployerActivity } from "@/lib/database";
import {
  Calendar,
  Plus,
  FileText,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Search,
  Building,
  Clock,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";

interface EmployerActivityDialogProps {
  employer: Employer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTIVITY_CATEGORIES = [
  { value: "research", label: "Research", icon: Search },
  { value: "networking", label: "Networking", icon: Users },
  { value: "phone_call", label: "Phone Call", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
  { value: "meeting", label: "Meeting", icon: MessageSquare },
  { value: "interview_prep", label: "Interview Prep", icon: FileText },
  { value: "follow_up", label: "Follow Up", icon: Clock },
  { value: "other", label: "Other", icon: Building },
];

export function EmployerActivityDialog({
  employer,
  open,
  onOpenChange,
}: EmployerActivityDialogProps) {
  const [activities, setActivities] = useState<EmployerActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivity, setNewActivity] = useState({
    category: "",
    notes: "",
  });

  useEffect(() => {
    if (open && employer?.id) {
      loadActivities();
    }
  }, [open, employer?.id]);

  const loadActivities = async () => {
    if (!employer?.id) return;

    setLoading(true);
    try {
      const employerActivities = await employerActivityService.getByEmployerId(
        employer.id
      );
      setActivities(employerActivities);
    } catch (error) {
      console.error("Error loading employer activities:", error);
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!employer?.id || !newActivity.category) {
      toast.error("Please select a category");
      return;
    }

    try {
      await employerActivityService.create(
        employer.id,
        newActivity.category,
        newActivity.notes || undefined
      );

      toast.success("Activity added successfully");
      setNewActivity({ category: "", notes: "" });
      setShowAddForm(false);
      await loadActivities();
    } catch (error) {
      console.error("Error adding activity:", error);
      toast.error("Failed to add activity");
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    try {
      await employerActivityService.delete(activityId);
      toast.success("Activity deleted successfully");
      await loadActivities();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  const getCategoryInfo = (category: string) => {
    const categoryInfo = ACTIVITY_CATEGORIES.find((c) => c.value === category);
    return categoryInfo || { label: category, icon: Building };
  };

  const formatActivityDate = (date: Date) => {
    return DateTime.fromJSDate(date).toRelative();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Activities for {employer?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Activity Form */}
          {showAddForm ? (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Add New Activity</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newActivity.category}
                    onValueChange={(value) =>
                      setNewActivity({ ...newActivity, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity category" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_CATEGORIES.map((category) => {
                        const Icon = category.icon;
                        return (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {category.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes..."
                    value={newActivity.notes}
                    onChange={(e) =>
                      setNewActivity({ ...newActivity, notes: e.target.value })
                    }
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddActivity}>Add Activity</Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          )}

          <Separator />

          {/* Activities List */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Activity History ({activities.length})
            </h3>

            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No activities recorded yet</p>
                <p className="text-sm">
                  Add an activity to start tracking your employer interactions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => {
                  const categoryInfo = getCategoryInfo(activity.category);
                  const Icon = categoryInfo.icon;

                  return (
                    <div
                      key={activity.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {categoryInfo.label}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatActivityDate(activity.createdAt)}
                              </span>
                            </div>
                            {activity.notes && (
                              <p className="text-sm text-muted-foreground">
                                {activity.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {DateTime.fromJSDate(
                                activity.createdAt
                              ).toLocaleString(DateTime.DATETIME_MED)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteActivity(activity.id!)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
