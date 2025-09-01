"use client";

import { useState, useRef } from "react";
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
import { ImportExportService } from "@/lib/import-export";
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle,
  FileText,
  Building,
  Briefcase,
  Hash,
} from "lucide-react";

interface ImportExportProps {
  onDataChanged: () => void;
}

export function ImportExport({ onDataChanged }: ImportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    employersImported: number;
    jobsImported: number;
    keywordsImported: number;
    activitiesImported: number;
    goalsImported: number;
    userKeywordsImported: number;
    skipped: number;
  } | null>(null);
  const [exportStats, setExportStats] = useState<{
    totalEmployers: number;
    totalJobs: number;
    totalKeywords: number;
    totalActivities: number;
    totalGoals: number;
    totalUserKeywords: number;
    lastModified?: Date;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadExportStats = async () => {
    try {
      const stats = await ImportExportService.getExportStats();
      setExportStats(stats);
    } catch (err) {
      console.error("Error loading export stats:", err);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);

    try {
      await ImportExportService.downloadExport();
      toast.success("Data exported successfully!", {
        description: "Your backup file has been downloaded.",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export data";
      setError(errorMessage);
      toast.error("Export failed", {
        description: errorMessage,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const result = await ImportExportService.importFromFile(file);

      setImportResult(result);
      toast.success("Data imported successfully!", {
        description: `Imported ${result.employersImported} employers, ${result.jobsImported} jobs, ${result.keywordsImported} keywords, ${result.activitiesImported} activities, ${result.goalsImported} goals, and ${result.userKeywordsImported} user keywords.`,
      });
      onDataChanged();
      await loadExportStats();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import data";
      setError(errorMessage);
      toast.error("Import failed", {
        description: errorMessage,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleTestDataImport = async () => {
    if (
      !window.confirm(
        "This will replace all existing data with test data including employers, jobs, keywords, activities, goals, and user keywords. Continue?"
      )
    ) {
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      // Fetch the test data from public folder
      const response = await fetch("/test-data.json");
      if (!response.ok) {
        throw new Error("Failed to fetch test data file");
      }

      const testDataText = await response.text();

      // Create a File object from the fetched data
      const blob = new Blob([testDataText], { type: "application/json" });
      const file = new File([blob], "test-data.json", {
        type: "application/json",
      });

      // Use the same import method as file uploads
      const result = await ImportExportService.importFromFile(file);

      setImportResult(result);
      toast.success("Test data imported successfully!", {
        description: `Imported ${result.employersImported} employers, ${result.jobsImported} jobs, ${result.keywordsImported} keywords, ${result.activitiesImported} activities, ${result.goalsImported} goals, and ${result.userKeywordsImported} user keywords.`,
      });
      onDataChanged();
      await loadExportStats();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to import test data";
      setError(errorMessage);
      toast.error("Import failed", {
        description: errorMessage,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Data
          </CardTitle>
          <CardDescription>
            Download all your employer, job, and keyword data as a JSON file for
            backup or transfer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exportStats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <Building className="h-4 w-4" />
                  Employers
                </div>
                <div className="text-2xl font-bold">
                  {exportStats.totalEmployers}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <Briefcase className="h-4 w-4" />
                  Jobs
                </div>
                <div className="text-2xl font-bold">
                  {exportStats.totalJobs}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <Hash className="h-4 w-4" />
                  Keywords
                </div>
                <div className="text-2xl font-bold">
                  {exportStats.totalKeywords}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <FileText className="h-4 w-4" />
                  Activities
                </div>
                <div className="text-2xl font-bold">
                  {exportStats.totalActivities}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <CheckCircle className="h-4 w-4" />
                  Goals
                </div>
                <div className="text-2xl font-bold">
                  {exportStats.totalGoals}
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                  <Hash className="h-4 w-4" />
                  User Keywords
                </div>
                <div className="text-2xl font-bold">
                  {exportStats.totalUserKeywords}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
            <Button
              variant="outline"
              onClick={loadExportStats}
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Upload a previously exported JSON file to restore or merge data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Warning about clearing data */}
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-700 dark:text-red-300">
              <strong>Warning:</strong> Importing will permanently delete all
              existing data and replace it with the imported data. Make sure you
              have a backup!
            </div>
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              onClick={triggerFileSelect}
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isImporting ? "Importing..." : "Choose File to Import"}
            </Button>
            
            <Button
              onClick={handleTestDataImport}
              disabled={isImporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              {isImporting ? "Importing..." : "Import Test Data"}
            </Button>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-green-800 dark:text-green-200">
                  Import Completed Successfully!
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <div className="text-green-600 dark:text-green-400">
                    Employers
                  </div>
                  <div className="font-medium">
                    {importResult.employersImported} imported
                  </div>
                </div>
                <div>
                  <div className="text-green-600 dark:text-green-400">Jobs</div>
                  <div className="font-medium">
                    {importResult.jobsImported} imported
                  </div>
                </div>
                <div>
                  <div className="text-green-600 dark:text-green-400">
                    Keywords
                  </div>
                  <div className="font-medium">
                    {importResult.keywordsImported} imported
                  </div>
                </div>
                <div>
                  <div className="text-green-600 dark:text-green-400">
                    Activities
                  </div>
                  <div className="font-medium">
                    {importResult.activitiesImported} imported
                  </div>
                </div>
                <div>
                  <div className="text-green-600 dark:text-green-400">
                    Goals
                  </div>
                  <div className="font-medium">
                    {importResult.goalsImported} imported
                  </div>
                </div>
                <div>
                  <div className="text-green-600 dark:text-green-400">
                    User Keywords
                  </div>
                  <div className="font-medium">
                    {importResult.userKeywordsImported} imported
                  </div>
                </div>
              </div>

              {importResult.skipped > 0 && (
                <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                  <div className="text-green-600 dark:text-green-400 text-sm">
                    Skipped: {importResult.skipped} items (duplicates or errors)
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-red-800 dark:text-red-200">
                  Error
                </span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
          <div>
            <strong>Export:</strong> Creates a JSON file containing all your
            employers, jobs, and keywords. This file can be used as a backup or
            to transfer data to another device.
          </div>
          <div>
            <strong>Import:</strong> Uploads a previously exported JSON file and
            adds the data to your current database. You can choose to clear
            existing data first or merge with existing data.
          </div>
          <div>
            <strong>Skip Duplicates:</strong> When enabled, the import process
            will skip entries that already exist (same employer name, same job
            title + employer, same keyword + job).
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
