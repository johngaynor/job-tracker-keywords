"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImportExport } from "@/components/ImportExport";
import { ImportExportService } from "@/lib/import-export";
import { Trash2, AlertTriangle, Settings as SettingsIcon } from "lucide-react";

interface SettingsProps {
  onDataChanged: () => void;
}

export function Settings({ onDataChanged }: SettingsProps) {
  const [isWiping, setIsWiping] = useState(false);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);
  const [wipeComplete, setWipeComplete] = useState(false);

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
