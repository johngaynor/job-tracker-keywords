import {
  employerService,
  jobService,
  keywordService,
  activityService,
  goalService,
} from "./db-services";
import { Employer, Job, Keyword, Activity, Goal, db } from "./database";

export interface ExportData {
  version: string;
  exportDate: string;
  employers: Employer[];
  jobs: Job[];
  keywords: Keyword[];
  activities: Activity[];
  goals?: Goal[]; // Optional for backward compatibility
}

export class ImportExportService {
  private static readonly CURRENT_VERSION = "1.0";

  /**
   * Export all data to a JSON structure
   */
  static async exportData(): Promise<ExportData> {
    try {
      console.log("Starting data export...");
      const startTime = performance.now();

      // Use direct database access for better performance
      const [employers, jobs, keywords, activities, goals] = await Promise.all([
        db.employers.toArray(),
        db.jobs.toArray(),
        db.keywords.toArray(),
        db.activities.toArray(),
        db.goals.toArray(),
      ]);

      const endTime = performance.now();
      console.log(`Export data retrieval completed in ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`Exported: ${employers.length} employers, ${jobs.length} jobs, ${keywords.length} keywords, ${activities.length} activities, ${goals.length} goals`);

      return {
        version: this.CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        employers,
        jobs,
        keywords,
        activities,
        goals: goals || [], // Ensure goals is always an array
      };
    } catch (error) {
      console.error("Error exporting data:", error);
      throw new Error("Failed to export data");
    }
  }

  /**
   * Export data and download as JSON file
   */
  static async downloadExport(): Promise<void> {
    try {
      console.log("Starting export download...");
      const exportStartTime = performance.now();

      const data = await this.exportData();
      
      const jsonStartTime = performance.now();
      console.log("Serializing data to JSON...");
      
      // Keep pretty printing for readability
      const jsonString = JSON.stringify(data, null, 2);
      
      const jsonEndTime = performance.now();
      console.log(`JSON serialization completed in ${(jsonEndTime - jsonStartTime).toFixed(2)}ms`);
      console.log(`JSON size: ${(jsonString.length / 1024 / 1024).toFixed(2)} MB`);

      const blob = new Blob([jsonString], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Create filename with date and time
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS
      a.download = `employer-keywords-export-${dateStr}-${timeStr}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const totalTime = performance.now() - exportStartTime;
      console.log(`Export download completed in ${totalTime.toFixed(2)}ms total`);
    } catch (error) {
      console.error("Error downloading export:", error);
      throw new Error("Failed to download export file");
    }
  }

  /**
   * Import data from a JSON structure
   */
  static async importData(
    data: ExportData,
    options: {
      clearExisting?: boolean;
      skipDuplicates?: boolean;
    } = {}
  ): Promise<{
    employersImported: number;
    jobsImported: number;
    keywordsImported: number;
    activitiesImported: number;
    goalsImported: number;
    skipped: number;
  }> {
    const { clearExisting = false, skipDuplicates = true } = options;

    try {
      // Validate data structure
      this.validateImportData(data);

      let employersImported = 0;
      let jobsImported = 0;
      let keywordsImported = 0;
      let activitiesImported = 0;
      let goalsImported = 0;
      let skipped = 0;

      // Clear existing data if requested
      if (clearExisting) {
        console.log("importData: clearExisting=true, calling clearAllData...");
        await this.clearAllData();
        console.log("importData: clearAllData completed, continuing with import...");
      }

      // Import employers
      const employerIdMap = new Map<number, number>(); // old ID -> new ID
      for (const employer of data.employers) {
        try {
          if (skipDuplicates) {
            const existing = await employerService.findByName(employer.name);
            if (existing) {
              employerIdMap.set(employer.id!, existing.id!);
              skipped++;
              continue;
            }
          }

          const newId = await employerService.create(
            employer.name,
            employer.notes
          );
          employerIdMap.set(employer.id!, newId);
          employersImported++;
        } catch (error) {
          console.warn(`Failed to import employer: ${employer.name}`, error);
          skipped++;
        }
      }

      // Import jobs
      const jobIdMap = new Map<number, number>(); // old ID -> new ID
      for (const job of data.jobs) {
        try {
          const newEmployerId = employerIdMap.get(job.employerId);
          if (!newEmployerId) {
            console.warn(`Skipping job ${job.title} - employer not found`);
            skipped++;
            continue;
          }

          if (skipDuplicates) {
            const existing = await jobService.findByTitleAndEmployer(
              job.title,
              newEmployerId
            );
            if (existing) {
              jobIdMap.set(job.id!, existing.id!);
              skipped++;
              continue;
            }
          }

          const newId = await jobService.create(
            newEmployerId,
            job.title,
            job.notes,
            job.link,
            job.referenceNumber,
            job.salaryEstimate,
            job.interestLevel
          );

          // Update status if different from default
          if (job.status !== "not applied") {
            await jobService.updateStatus(newId, job.status);
          }

          jobIdMap.set(job.id!, newId);
          jobsImported++;
        } catch (error) {
          console.warn(`Failed to import job: ${job.title}`, error);
          skipped++;
        }
      }

      // Import keywords
      for (const keyword of data.keywords) {
        try {
          const newJobId = jobIdMap.get(keyword.jobId);
          if (!newJobId) {
            console.warn(`Skipping keyword ${keyword.keyword} - job not found`);
            skipped++;
            continue;
          }

          if (skipDuplicates) {
            const existing = await keywordService.findByJobAndKeyword(
              newJobId,
              keyword.keyword
            );
            if (existing) {
              skipped++;
              continue;
            }
          }

          await keywordService.create(newJobId, keyword.keyword);
          keywordsImported++;
        } catch (error) {
          console.warn(`Failed to import keyword: ${keyword.keyword}`, error);
          skipped++;
        }
      }

      // Import activities
      for (const activity of data.activities || []) {
        try {
          const newJobId = jobIdMap.get(activity.jobId);
          if (!newJobId) {
            console.warn(
              `Skipping activity for job ${activity.jobId} - job not found`
            );
            skipped++;
            continue;
          }

          await activityService.create(
            newJobId,
            activity.type,
            activity.category,
            activity.notes,
            activity.previousStatus,
            activity.newStatus
          );
          activitiesImported++;
        } catch (error) {
          console.warn(
            `Failed to import activity: ${activity.category}`,
            error
          );
          skipped++;
        }
      }

      // Import goals
      for (const goal of data.goals || []) {
        try {
          await goalService.upsert(
            goal.type,
            goal.targetNumber,
            goal.frequencyDays
          );
          goalsImported++;
        } catch (error) {
          console.warn(`Failed to import goal: ${goal.type}`, error);
          skipped++;
        }
      }

      return {
        employersImported,
        jobsImported,
        keywordsImported,
        activitiesImported,
        goalsImported,
        skipped,
      };
    } catch (error) {
      console.error("Error importing data:", error);
      throw new Error("Failed to import data");
    }
  }

  /**
   * Import data from uploaded file
   */
  static async importFromFile(
    file: File,
    options?: {
      clearExisting?: boolean;
      skipDuplicates?: boolean;
    }
  ): Promise<{
    employersImported: number;
    jobsImported: number;
    keywordsImported: number;
    activitiesImported: number;
    goalsImported: number;
    skipped: number;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content) as ExportData;
          const result = await this.importData(data, options);
          resolve(result);
        } catch (error) {
          console.log(error);
          reject(new Error("Invalid file format or corrupted data"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validate import data structure
   */
  private static validateImportData(data: any): asserts data is ExportData {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data format");
    }

    if (!data.version || !data.exportDate) {
      throw new Error("Missing required metadata");
    }

    if (
      !Array.isArray(data.employers) ||
      !Array.isArray(data.jobs) ||
      !Array.isArray(data.keywords) ||
      !Array.isArray(data.activities || [])
    ) {
      throw new Error("Invalid data structure");
    }

    // Ensure goals is an array (or empty array for backward compatibility)
    if (!Array.isArray(data.goals || [])) {
      throw new Error("Invalid goals data structure");
    }

    // Basic validation of data arrays
    for (const employer of data.employers) {
      if (!employer.name || typeof employer.name !== "string") {
        throw new Error("Invalid employer data");
      }
    }

    for (const job of data.jobs) {
      if (!job.title || !job.employerId) {
        throw new Error("Invalid job data");
      }
    }

    for (const keyword of data.keywords) {
      if (!keyword.keyword || !keyword.jobId) {
        throw new Error("Invalid keyword data");
      }
    }
  }

  /**
   * Clear all data from the database
   */
  private static async clearAllData(): Promise<void> {
    console.log("Starting clearAllData...");
    
    // Use Dexie transaction for efficient bulk deletion
    await db.transaction('rw', [db.activities, db.keywords, db.jobs, db.employers, db.goals], async () => {
      console.log("Clearing activities...");
      await db.activities.clear();
      console.log("Activities cleared ✓");
      
      console.log("Clearing keywords...");
      await db.keywords.clear();
      console.log("Keywords cleared ✓");
      
      console.log("Clearing jobs...");
      await db.jobs.clear();
      console.log("Jobs cleared ✓");
      
      console.log("Clearing employers...");
      await db.employers.clear();
      console.log("Employers cleared ✓");
      
      console.log("Clearing goals...");
      await db.goals.clear();
      console.log("Goals cleared ✓");
    });
    
    console.log("clearAllData completed successfully!");
  }

  /**
   * Get export statistics
   */
  static async getExportStats(): Promise<{
    totalEmployers: number;
    totalJobs: number;
    totalKeywords: number;
    totalActivities: number;
    totalGoals: number;
    lastModified?: Date;
  }> {
    try {
      const [employers, jobs, keywords, activities, goals] = await Promise.all([
        employerService.getAll(),
        jobService.getAll(),
        keywordService.getAll(),
        activityService.getAll(),
        goalService.getAll(),
      ]);

      // Find the most recent update
      const lastModified = [...employers, ...jobs, ...keywords, ...activities, ...goals]
        .map((item) => new Date(item.updatedAt))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      return {
        totalEmployers: employers.length,
        totalJobs: jobs.length,
        totalKeywords: keywords.length,
        totalActivities: activities.length,
        totalGoals: goals.length,
        lastModified,
      };
    } catch (error) {
      console.error("Error getting export stats:", error);
      throw new Error("Failed to get statistics");
    }
  }
}
