import { db, Employer, Job, Keyword, Activity } from "./database";

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

  async findByName(name: string): Promise<Employer | undefined> {
    return await db.employers.where("name").equalsIgnoreCase(name).first();
  },

  async deleteAll(): Promise<void> {
    // First delete all related data
    const jobs = await db.jobs.toArray();
    for (const job of jobs) {
      if (job.id) {
        await keywordService.deleteByJobId(job.id);
      }
    }
    await db.jobs.clear();
    await db.employers.clear();
  },
};

// Job operations
export const jobService = {
  async create(
    employerId: number,
    title: string,
    notes?: string,
    link?: string,
    referenceNumber?: string,
    salaryEstimate?: string,
    interestLevel?: number
  ): Promise<number> {
    const now = new Date();
    return await db.jobs.add({
      employerId,
      title,
      notes,
      link,
      referenceNumber,
      salaryEstimate,
      interestLevel,
      status: "not applied",
      createdAt: now,
      updatedAt: now,
    });
  },

  async getAll(): Promise<Job[]> {
    return await db.jobs.orderBy("createdAt").reverse().toArray();
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
    await activityService.deleteByJobId(id);
    await db.jobs.delete(id);
  },

  async getJobsWithEmployers(): Promise<(Job & { employer: Employer })[]> {
    const jobs = await db.jobs.orderBy("createdAt").reverse().toArray();
    const result: (Job & { employer: Employer })[] = [];

    for (const job of jobs) {
      const employer = await db.employers.get(job.employerId);
      if (employer) {
        result.push({ ...job, employer });
      }
    }

    return result;
  },

  async findByTitleAndEmployer(
    title: string,
    employerId: number
  ): Promise<Job | undefined> {
    return await db.jobs
      .where("[employerId+title]")
      .equals([employerId, title])
      .first();
  },

  async updateStatus(
    id: number,
    status:
      | "not applied"
      | "applied"
      | "interview"
      | "rejected"
      | "offer"
      | "withdrawn"
  ): Promise<number> {
    return await this.update(id, { status });
  },

  async deleteAll(): Promise<void> {
    // First delete all related keywords
    const jobs = await db.jobs.toArray();
    for (const job of jobs) {
      if (job.id) {
        await keywordService.deleteByJobId(job.id);
      }
    }
    await db.jobs.clear();
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

  async findByJobAndKeyword(
    jobId: number,
    keyword: string
  ): Promise<Keyword | undefined> {
    return await db.keywords
      .where("[jobId+keyword]")
      .equals([jobId, keyword.toLowerCase()])
      .first();
  },

  async deleteAll(): Promise<void> {
    await db.keywords.clear();
  },
};

// Activity operations
export const activityService = {
  async create(
    jobId: number,
    type: "status_change" | "activity",
    category: string,
    notes?: string,
    previousStatus?: string,
    newStatus?: string
  ): Promise<number> {
    const now = new Date();
    return await db.activities.add({
      jobId,
      type,
      category,
      notes,
      previousStatus,
      newStatus,
      createdAt: now,
      updatedAt: now,
    });
  },

  async getByJobId(jobId: number): Promise<Activity[]> {
    return await db.activities
      .where("jobId")
      .equals(jobId)
      .toArray()
      .then((activities) =>
        activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      );
  },

  async getAll(): Promise<Activity[]> {
    return await db.activities.orderBy("createdAt").reverse().toArray();
  },

  async update(id: number, updates: Partial<Activity>): Promise<number> {
    return await db.activities.update(id, {
      ...updates,
      updatedAt: new Date(),
    });
  },

  async delete(id: number): Promise<void> {
    await db.activities.delete(id);
  },

  async deleteByJobId(jobId: number): Promise<number> {
    return await db.activities.where("jobId").equals(jobId).delete();
  },

  async deleteAll(): Promise<void> {
    await db.activities.clear();
  },
};
