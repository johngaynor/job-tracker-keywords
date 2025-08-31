"use client";

import { useState, useEffect } from "react";
import { AddJobForm } from "./components/AddJobForm";
import { employerService } from "@/lib/db-services";
import { Employer } from "@/lib/database";

export default function AddJobPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);

  const loadEmployers = async () => {
    try {
      const employerList = await employerService.getAll();
      setEmployers(employerList);
    } catch (error) {
      console.error("Error loading employers:", error);
    }
  };

  useEffect(() => {
    loadEmployers();
  }, []);

  const handleJobAdded = () => {
    // Refresh employers list in case a new one was added
    loadEmployers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Add Application</h2>
      </div>
      <AddJobForm employers={employers} onJobAdded={handleJobAdded} />
    </div>
  );
}
