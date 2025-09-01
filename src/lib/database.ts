import Dexie, { Table } from "dexie";

export type Industry =
  | "SaaS"
  | "Finance"
  | "Healthcare"
  | "Education"
  | "E-Commerce"
  | "Transportation"
  | "Energy"
  | "Telecommunications"
  | "Government"
  | "Defense"
  | "Gaming"
  | "Manufacturing"
  | "Biotech"
  | "Nonprofit"
  | "Real Estate"
  | "Agriculture"
  | "Travel"
  | "Cybersecurity"
  | "Consulting"
  | "Other";

export interface Employer {
  id?: number;
  name: string;
  notes?: string;
  industry?: Industry;
  favorited?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id?: number;
  employerId: number;
  title: string;
  notes?: string;
  link?: string;
  referenceNumber?: string;
  salaryEstimate?: string;
  interestLevel?: number;
  archived?: boolean;
  favorited?: boolean;
  status:
    | "not applied"
    | "applied"
    | "interview"
    | "rejected"
    | "offer"
    | "withdrawn";
  createdAt: Date;
  updatedAt: Date;
}

export interface Keyword {
  id?: number;
  jobId: number;
  keyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserKeyword {
  id?: number;
  keyword: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id?: number;
  jobId: number;
  type: "status_change" | "activity";
  category: string;
  notes?: string;
  previousStatus?: string; // For status changes only
  newStatus?: string; // For status changes only
  createdAt: Date;
  updatedAt: Date;
}

export interface Goal {
  id?: number;
  type:
    | "applications_created"
    | "applications_applied"
    | "interviews"
    | "offers"
    | "productive_activities";
  targetNumber: number;
  frequencyDays: number; // stored in days (weeks converted to days)
  createdAt: Date;
  updatedAt: Date;
}

export class EmployerKeywordsDB extends Dexie {
  employers!: Table<Employer>;
  jobs!: Table<Job>;
  keywords!: Table<Keyword>;
  userKeywords!: Table<UserKeyword>;
  activities!: Table<Activity>;
  goals!: Table<Goal>;

  constructor() {
    super("EmployerKeywordsDB");
    this.version(1).stores({
      employers: "++id, name, notes, createdAt, updatedAt",
      jobs: "++id, employerId, title, notes, link, referenceNumber, salaryEstimate, interestLevel, archived, status, [employerId+title], createdAt, updatedAt",
      keywords: "++id, jobId, keyword, [jobId+keyword], createdAt, updatedAt",
      activities:
        "++id, jobId, type, category, notes, previousStatus, newStatus, createdAt, updatedAt",
    });

    // Version 2: Add goals table
    this.version(2).stores({
      employers: "++id, name, notes, createdAt, updatedAt",
      jobs: "++id, employerId, title, notes, link, referenceNumber, salaryEstimate, interestLevel, archived, status, [employerId+title], createdAt, updatedAt",
      keywords: "++id, jobId, keyword, [jobId+keyword], createdAt, updatedAt",
      activities:
        "++id, jobId, type, category, notes, previousStatus, newStatus, createdAt, updatedAt",
      goals: "++id, type, targetNumber, frequencyDays, createdAt, updatedAt",
    });

    // Version 3: Add user keywords table
    this.version(3).stores({
      employers: "++id, name, notes, createdAt, updatedAt",
      jobs: "++id, employerId, title, notes, link, referenceNumber, salaryEstimate, interestLevel, archived, status, [employerId+title], createdAt, updatedAt",
      keywords: "++id, jobId, keyword, [jobId+keyword], createdAt, updatedAt",
      userKeywords: "++id, keyword, createdAt, updatedAt",
      activities:
        "++id, jobId, type, category, notes, previousStatus, newStatus, createdAt, updatedAt",
      goals: "++id, type, targetNumber, frequencyDays, createdAt, updatedAt",
    });
  }
}

export const db = new EmployerKeywordsDB();
