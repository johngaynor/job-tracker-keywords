"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AddJobForm } from "./components/AddJobForm";
import { employerService } from "@/lib/db-services";
import { Employer } from "@/lib/database";

export default function AddJobPage() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const router = useRouter();

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
        <Button
          variant="outline"
          onClick={() => router.push("/applications")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Button>
      </div>
      <AddJobForm employers={employers} onJobAdded={handleJobAdded} />
    </div>
  );
}
