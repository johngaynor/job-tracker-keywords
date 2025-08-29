"use client";

import { useState, useEffect } from "react";
import { AddJobForm } from "@/components/AddJobForm";
import { JobsList } from "@/components/JobsList";
import { KeywordStats } from "@/components/KeywordStats";
import { ThemeToggle } from "@/components/theme-toggle";
import { employerService } from "@/lib/db-services";
import { Employer } from "@/lib/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, BarChart3, Plus } from "lucide-react";

export default function Home() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [refreshKey]);

  const handleJobAdded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Employer Keywords Tracker
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Track and analyze keywords from your job applications to optimize
              your search strategy.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="add" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Application
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add" className="space-y-6">
            <AddJobForm employers={employers} onJobAdded={handleJobAdded} />
          </TabsContent>

          <TabsContent value="jobs" className="space-y-6">
            <JobsList key={refreshKey} />
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <KeywordStats key={refreshKey} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
