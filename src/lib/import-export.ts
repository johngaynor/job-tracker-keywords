import { employerService, jobService, keywordService } from './db-services';
import { Employer, Job, Keyword } from './database';

export interface ExportData {
  version: string;
  exportDate: string;
  employers: Employer[];
  jobs: Job[];
  keywords: Keyword[];
}

export class ImportExportService {
  private static readonly CURRENT_VERSION = '1.0';

  /**
   * Export all data to a JSON structure
   */
  static async exportData(): Promise<ExportData> {
    try {
      const [employers, jobs, keywords] = await Promise.all([
        employerService.getAll(),
        jobService.getAll(),
        keywordService.getAll()
      ]);

      return {
        version: this.CURRENT_VERSION,
        exportDate: new Date().toISOString(),
        employers,
        jobs,
        keywords
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Export data and download as JSON file
   */
  static async downloadExport(): Promise<void> {
    try {
      const data = await this.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employer-keywords-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading export:', error);
      throw new Error('Failed to download export file');
    }
  }

  /**
   * Import data from a JSON structure
   */
  static async importData(data: ExportData, options: {
    clearExisting?: boolean;
    skipDuplicates?: boolean;
  } = {}): Promise<{
    employersImported: number;
    jobsImported: number;
    keywordsImported: number;
    skipped: number;
  }> {
    const { clearExisting = false, skipDuplicates = true } = options;
    
    try {
      // Validate data structure
      this.validateImportData(data);

      let employersImported = 0;
      let jobsImported = 0;
      let keywordsImported = 0;
      let skipped = 0;

      // Clear existing data if requested
      if (clearExisting) {
        await this.clearAllData();
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

          const newId = await employerService.create(employer.name, employer.notes);
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
            const existing = await jobService.findByTitleAndEmployer(job.title, newEmployerId);
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
            new Date(job.appliedDate)
          );
          
          // Update status if different from default
          if (job.status !== 'applied') {
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
            const existing = await keywordService.findByJobAndKeyword(newJobId, keyword.keyword);
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

      return {
        employersImported,
        jobsImported,
        keywordsImported,
        skipped
      };
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }

  /**
   * Import data from uploaded file
   */
  static async importFromFile(file: File, options?: {
    clearExisting?: boolean;
    skipDuplicates?: boolean;
  }): Promise<{
    employersImported: number;
    jobsImported: number;
    keywordsImported: number;
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
          reject(new Error('Invalid file format or corrupted data'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Validate import data structure
   */
  private static validateImportData(data: any): asserts data is ExportData {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format');
    }

    if (!data.version || !data.exportDate) {
      throw new Error('Missing required metadata');
    }

    if (!Array.isArray(data.employers) || !Array.isArray(data.jobs) || !Array.isArray(data.keywords)) {
      throw new Error('Invalid data structure');
    }

    // Basic validation of data arrays
    for (const employer of data.employers) {
      if (!employer.name || typeof employer.name !== 'string') {
        throw new Error('Invalid employer data');
      }
    }

    for (const job of data.jobs) {
      if (!job.title || !job.employerId || !job.appliedDate) {
        throw new Error('Invalid job data');
      }
    }

    for (const keyword of data.keywords) {
      if (!keyword.keyword || !keyword.jobId) {
        throw new Error('Invalid keyword data');
      }
    }
  }

  /**
   * Clear all data from the database
   */
  private static async clearAllData(): Promise<void> {
    // Clear in reverse dependency order
    await keywordService.deleteAll();
    await jobService.deleteAll();
    await employerService.deleteAll();
  }

  /**
   * Get export statistics
   */
  static async getExportStats(): Promise<{
    totalEmployers: number;
    totalJobs: number;
    totalKeywords: number;
    lastModified?: Date;
  }> {
    try {
      const [employers, jobs, keywords] = await Promise.all([
        employerService.getAll(),
        jobService.getAll(),
        keywordService.getAll()
      ]);

      // Find the most recent update
      const lastModified = [...employers, ...jobs, ...keywords]
        .map(item => new Date(item.updatedAt))
        .sort((a, b) => b.getTime() - a.getTime())[0];

      return {
        totalEmployers: employers.length,
        totalJobs: jobs.length,
        totalKeywords: keywords.length,
        lastModified
      };
    } catch (error) {
      console.error('Error getting export stats:', error);
      throw new Error('Failed to get statistics');
    }
  }
}
