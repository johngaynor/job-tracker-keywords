import Dexie, { Table } from "dexie";

export interface Employer {
  id?: number;
  name: string;
  notes?: string;
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

export class EmployerKeywordsDB extends Dexie {
  employers!: Table<Employer>;
  jobs!: Table<Job>;
  keywords!: Table<Keyword>;
  activities!: Table<Activity>;

  constructor() {
    super("EmployerKeywordsDB");
    this.version(1).stores({
      employers: "++id, name, notes, createdAt, updatedAt",
      jobs: "++id, employerId, title, notes, link, referenceNumber, salaryEstimate, interestLevel, archived, status, [employerId+title], createdAt, updatedAt",
      keywords: "++id, jobId, keyword, [jobId+keyword], createdAt, updatedAt",
      activities:
        "++id, jobId, type, category, notes, previousStatus, newStatus, createdAt, updatedAt",
    });
  }
}

export const db = new EmployerKeywordsDB();
