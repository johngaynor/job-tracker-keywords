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
  appliedDate: Date;
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

export class EmployerKeywordsDB extends Dexie {
  employers!: Table<Employer>;
  jobs!: Table<Job>;
  keywords!: Table<Keyword>;

  constructor() {
    super("EmployerKeywordsDB");
    this.version(1).stores({
      employers: "++id, name, notes, createdAt, updatedAt",
      jobs: "++id, employerId, title, notes, link, appliedDate, status, [employerId+title], createdAt, updatedAt",
      keywords: "++id, jobId, keyword, [jobId+keyword], createdAt, updatedAt",
    });
  }
}

export const db = new EmployerKeywordsDB();
