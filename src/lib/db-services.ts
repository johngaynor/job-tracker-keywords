import { db, Employer, Job, Keyword } from "./database";

// Employer operations
export const employerService = {
  async create(name: string, notes?: string): Promise<number> {
    const now = new Date();
    return await db.employers.add({
      name,
      notes,
      createdAt: now,
      updatedAt: now,
    });
  },

  async getAll(): Promise<Employer[]> {
    return await db.employers.orderBy("name").toArray();
  },

  async getById(id: number): Promise<Employer | undefined> {
    return await db.employers.get(id);
  },

  async update(id: number, updates: Partial<Employer>): Promise<number> {
    return await db.employers.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async delete(id: number): Promise<void> {
    // Delete all related jobs and keywords first
    const jobs = await db.jobs.where("employerId").equals(id).toArray();
    for (const job of jobs) {
      if (job.id) {
        await keywordService.deleteByJobId(job.id);
      }
    }
    await db.jobs.where("employerId").equals(id).delete();
    await db.employers.delete(id);
  },
};

// Job operations
export const jobService = {
  async create(
    employerId: number,
    title: string,
    notes?: string,
    appliedDate: Date = new Date()
  ): Promise<number> {
    const now = new Date();
    return await db.jobs.add({
      employerId,
      title,
      notes,
      appliedDate,
      status: "applied",
      createdAt: now,
      updatedAt: now,
    });
  },

  async getAll(): Promise<Job[]> {
    return await db.jobs.orderBy("appliedDate").reverse().toArray();
  },

  async getByEmployerId(employerId: number): Promise<Job[]> {
    return await db.jobs.where("employerId").equals(employerId).toArray();
  },

  async getById(id: number): Promise<Job | undefined> {
    return await db.jobs.get(id);
  },

  async update(id: number, updates: Partial<Job>): Promise<number> {
    return await db.jobs.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async delete(id: number): Promise<void> {
    await keywordService.deleteByJobId(id);
    await db.jobs.delete(id);
  },

  async getJobsWithEmployers(): Promise<(Job & { employer: Employer })[]> {
    const jobs = await db.jobs.orderBy("appliedDate").reverse().toArray();
    const result = [];

    for (const job of jobs) {
      const employer = await db.employers.get(job.employerId);
      if (employer) {
        result.push({ ...job, employer });
      }
    }

    return result;
  },
};

// Keyword operations
export const keywordService = {
  async create(jobId: number, keyword: string): Promise<number> {
    const now = new Date();

    // Check if keyword already exists for this job
    const existing = await db.keywords
      .where("[jobId+keyword]")
      .equals([jobId, keyword.toLowerCase()])
      .first();

    if (existing) {
      // Keyword already exists, just return its id
      return existing.id!;
    }

    return await db.keywords.add({
      jobId,
      keyword: keyword.toLowerCase(),
      createdAt: now,
      updatedAt: now,
    });
  },

  async getByJobId(jobId: number): Promise<Keyword[]> {
    return await db.keywords.where("jobId").equals(jobId).toArray();
  },

  async getAll(): Promise<Keyword[]> {
    return await db.keywords.toArray();
  },

  async update(id: number, updates: Partial<Keyword>): Promise<number> {
    return await db.keywords.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async delete(id: number): Promise<void> {
    await db.keywords.delete(id);
  },

  async deleteByJobId(jobId: number): Promise<number> {
    return await db.keywords.where("jobId").equals(jobId).delete();
  },

  async getKeywordStats(): Promise<
    { keyword: string; totalCount: number; jobCount: number }[]
  > {
    const keywords = await db.keywords.toArray();
    const stats = new Map<
      string,
      { totalCount: number; jobIds: Set<number> }
    >();

    for (const kw of keywords) {
      const existing = stats.get(kw.keyword) || {
        totalCount: 0,
        jobIds: new Set(),
      };
      existing.totalCount += 1; // Each keyword occurrence counts as 1
      existing.jobIds.add(kw.jobId);
      stats.set(kw.keyword, existing);
    }

    return Array.from(stats.entries())
      .map(([keyword, data]) => ({
        keyword,
        totalCount: data.totalCount,
        jobCount: data.jobIds.size,
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  },
};
