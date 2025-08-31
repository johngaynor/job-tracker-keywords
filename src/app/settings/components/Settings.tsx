"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImportExport } from "./ImportExport";
import { ImportExportService } from "@/lib/import-export";
import { goalService } from "@/lib/db-services";
import { Goal } from "@/lib/database";
import {
  Trash2,
  AlertTriangle,
  Settings as SettingsIcon,
  Target,
} from "lucide-react";

interface SettingsProps {
  onDataChanged: () => void;
}

export function Settings({ onDataChanged }: SettingsProps) {
  const [isWiping, setIsWiping] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeComplete, setWipeComplete] = useState(false);

  // Goals state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalInputs, setGoalInputs] = useState<{
    [key: string]: {
      targetNumber: string;
      frequency: string;
      unit: "days" | "weeks";
    };
  }>({
    productive_activities: { targetNumber: "", frequency: "", unit: "days" },
    applications_created: { targetNumber: "", frequency: "", unit: "days" },
    applications_applied: { targetNumber: "", frequency: "", unit: "days" },
    interviews: { targetNumber: "", frequency: "", unit: "days" },
    offers: { targetNumber: "", frequency: "", unit: "days" },
  });

  // Load goals on component mount
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const allGoals = await goalService.getAll();
      setGoals(allGoals);

      // Update input states with existing goals
      const newInputs = { ...goalInputs };
      allGoals.forEach((goal) => {
        if (goal.type in newInputs) {
          newInputs[goal.type] = {
            targetNumber: goal.targetNumber.toString(),
            frequency:
              goal.frequencyDays >= 7 && goal.frequencyDays % 7 === 0
                ? (goal.frequencyDays / 7).toString()
                : goal.frequencyDays.toString(),
            unit:
              goal.frequencyDays >= 7 && goal.frequencyDays % 7 === 0
                ? "weeks"
                : "days",
          };
        }
      });
      setGoalInputs(newInputs);
    } catch (error) {
      console.error("Error loading goals:", error);
      toast.error("Failed to load goals");
    }
  };

  const handleGoalInputChange = (
    goalType: string,
    field: "targetNumber" | "frequency" | "unit",
    value: string
  ) => {
    setGoalInputs((prev) => ({
      ...prev,
      [goalType]: {
        ...prev[goalType],
        [field]: value,
      },
    }));
  };

  const saveGoal = async (goalType: string) => {
    const input = goalInputs[goalType];
    const targetNumber = parseInt(input.targetNumber);
    const frequency = parseInt(input.frequency);

    if (isNaN(targetNumber) || targetNumber < 1) {
      toast.error("Please enter a valid target number");
      return;
    }

    if (isNaN(frequency) || frequency < 1) {
      toast.error("Please enter a valid frequency");
      return;
    }

    const frequencyDays = input.unit === "weeks" ? frequency * 7 : frequency;

    try {
      await goalService.upsert(
        goalType as
          | "applications_created"
          | "applications_applied"
          | "interviews"
          | "offers"
          | "productive_activities",
        targetNumber,
        frequencyDays
      );
      toast.success("Goal saved successfully");
      loadGoals(); // Reload to update the display
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to save goal");
    }
  };

  const deleteGoal = async (goalType: string) => {
    const existingGoal = goals.find((g) => g.type === goalType);
    if (existingGoal && existingGoal.id) {
      try {
        await goalService.delete(existingGoal.id);
        toast.success("Goal deleted successfully");
        loadGoals(); // Reload to update the display

        // Reset the input for this goal type
        setGoalInputs((prev) => ({
          ...prev,
          [goalType]: { targetNumber: "", frequency: "", unit: "days" },
        }));
      } catch (error) {
        console.error("Error deleting goal:", error);
        toast.error("Failed to delete goal");
      }
    }
  };

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case "applications_created":
        return "Applications Created";
      case "applications_applied":
        return "Applications Applied";
      case "interviews":
        return "Interviews";
      case "offers":
        return "Offers";
      case "productive_activities":
        return "Productive Activities";
      default:
        return type;
    }
  };

  const getGoalTypeDescription = (type: string) => {
    switch (type) {
      case "applications_created":
        return "Entered information but haven't applied";
      case "applications_applied":
        return "Applications submitted to employer";
      case "interviews":
        return "Applications actively interviewing";
      case "offers":
        return "Received offer from employer";
      case "productive_activities":
        return "Created applications, status changes, and activities";
      default:
        return "";
    }
  };

  const getGoalTypeColors = (type: string) => {
    switch (type) {
      case "applications_created":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      case "applications_applied":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800";
      case "interviews":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800";
      case "offers":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800";
      case "productive_activities":
        return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const handleFullWipe = async () => {
    setIsWiping(true);

    try {
      // Import an empty dataset with clearExisting=true to wipe everything
      await ImportExportService.importData(
        {
          version: "1.0",
          exportDate: new Date().toISOString(),
          employers: [],
          jobs: [],
          keywords: [],
          activities: [],
        },
        { clearExisting: true }
      );

      setWipeComplete(true);
      toast.success("All data deleted successfully!", {
        description: "Your database has been completely wiped.",
      });
      onDataChanged();

      // Hide the success message after 3 seconds
      setTimeout(() => {
        setWipeComplete(false);
      }, 3000);
    } catch (error) {
      console.error("Error wiping data:", error);
      toast.error("Failed to delete data", {
        description: "Please try again.",
      });
    } finally {
      setIsWiping(false);
      setShowWipeConfirm(false);
    }
  };

  const confirmWipe = () => {
    setShowWipeConfirm(true);
  };

  const cancelWipe = () => {
    setShowWipeConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      {/* Goals Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Application Goals
          </CardTitle>
          <CardDescription>
            Set targets for your job application activities to stay motivated
            and track progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.keys(goalInputs).map((goalType) => {
              const existingGoal = goals.find((g) => g.type === goalType);
              const input = goalInputs[goalType];

              return (
                <div key={goalType} className="space-y-3">
                  <div>
                    <Badge
                      variant="secondary"
                      className={`${getGoalTypeColors(
                        goalType
                      )} font-medium px-3 py-1`}
                    >
                      {getGoalTypeLabel(goalType)}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getGoalTypeDescription(goalType)}
                    </p>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <Label
                        htmlFor={`target-${goalType}`}
                        className="text-xs text-muted-foreground"
                      >
                        Target Number
                      </Label>
                      <Input
                        id={`target-${goalType}`}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 5"
                        value={input.targetNumber}
                        onChange={(e) =>
                          handleGoalInputChange(
                            goalType,
                            "targetNumber",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="flex-1">
                      <Label
                        htmlFor={`frequency-${goalType}`}
                        className="text-xs text-muted-foreground"
                      >
                        Every
                      </Label>
                      <Input
                        id={`frequency-${goalType}`}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="e.g., 1"
                        value={input.frequency}
                        onChange={(e) =>
                          handleGoalInputChange(
                            goalType,
                            "frequency",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="flex-1">
                      <Label
                        htmlFor={`unit-${goalType}`}
                        className="text-xs text-muted-foreground"
                      >
                        Period
                      </Label>
                      <Select
                        value={input.unit}
                        onValueChange={(value: "days" | "weeks") =>
                          handleGoalInputChange(goalType, "unit", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveGoal(goalType)}
                        disabled={!input.targetNumber || !input.frequency}
                        size="sm"
                      >
                        Save
                      </Button>

                      {existingGoal && (
                        <Button
                          onClick={() => deleteGoal(goalType)}
                          variant="outline"
                          size="sm"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {existingGoal && (
                    <div className="text-xs text-muted-foreground">
                      Current: {existingGoal.targetNumber}{" "}
                      {getGoalTypeLabel(goalType).toLowerCase()} every{" "}
                      {existingGoal.frequencyDays >= 7 &&
                      existingGoal.frequencyDays % 7 === 0
                        ? `${existingGoal.frequencyDays / 7} week${
                            existingGoal.frequencyDays / 7 > 1 ? "s" : ""
                          }`
                        : `${existingGoal.frequencyDays} day${
                            existingGoal.frequencyDays > 1 ? "s" : ""
                          }`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Import/Export Section */}
      <ImportExport onDataChanged={onDataChanged} />

      <Separator />

      {/* Full Wipe Section */}
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete all data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <strong>Warning:</strong> This will permanently delete all
              employers, job applications, and keywords from your database. Make
              sure to export your data first if you want to keep a backup.
            </div>
          </div>

          {/* Confirmation Flow */}
          {!showWipeConfirm ? (
            <Button
              variant="destructive"
              onClick={confirmWipe}
              disabled={isWiping}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete All Data
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Are you absolutely sure?
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This will delete all your data permanently. This action cannot
                  be undone.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={handleFullWipe}
                  disabled={isWiping}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {isWiping ? "Deleting..." : "Yes, Delete Everything"}
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelWipe}
                  disabled={isWiping}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Success Message */}
          {wipeComplete && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-green-600 dark:bg-green-400 rounded-full flex items-center justify-center">
                  <div className="h-2 w-2 bg-white rounded-full"></div>
                </div>
                <span className="font-medium text-green-800 dark:text-green-200">
                  All data has been successfully deleted.
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About Your Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <strong>Storage:</strong> All your data is stored locally in your
            browser using IndexedDB. No data is sent to any external servers.
          </div>
          <div>
            <strong>Privacy:</strong> Your employer and job application data
            remains completely private and is only accessible from this browser
            on this device.
          </div>
          <div>
            <strong>Backup:</strong> Use the export function to create backups
            of your data. This is especially important before clearing browser
            data or switching devices.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
