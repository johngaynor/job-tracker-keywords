"use client";

import { useState, useEffect } from "react";
import { AddJobForm } from "@/components/AddJobForm";
import { JobsList } from "@/components/JobsList";
import { KeywordStats } from "@/components/KeywordStats";
import { Settings as SettingsComponent } from "@/components/Settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { employerService } from "@/lib/db-services";
import { Employer } from "@/lib/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Briefcase, BarChart3, Plus, Settings } from "lucide-react";

export default function Home() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("add");

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

  const tabs = [
    { value: "add", label: "Add Application", icon: Plus },
    { value: "jobs", label: "Applications", icon: Briefcase },
    { value: "stats", label: "Statistics", icon: BarChart3 },
    { value: "data", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Job Application Tracker
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Track your job applications and identify popular skills and
              keywords to optimize your resume and skill acquisition. All data
              is stored locally. Happy searching :)
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <TooltipProvider>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            {/* Desktop Navigation - md and up */}
            <TabsList className="hidden md:grid w-full grid-cols-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Mobile Navigation - below md */}
            <div className="md:hidden">
              <div className="flex bg-muted p-1 rounded-lg w-full">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.value;
                  return (
                    <Tooltip key={tab.value}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size="icon"
                          onClick={() => setActiveTab(tab.value)}
                          className={`h-10 flex-1 ${
                            isActive
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tab.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            <TabsContent value="add" className="space-y-6">
              <AddJobForm employers={employers} onJobAdded={handleJobAdded} />
            </TabsContent>

            <TabsContent value="jobs" className="space-y-6">
              <JobsList key={refreshKey} />
            </TabsContent>

            <TabsContent value="stats" className="space-y-6">
              <KeywordStats key={refreshKey} />
            </TabsContent>

            <TabsContent value="data" className="space-y-6">
              <SettingsComponent onDataChanged={handleJobAdded} />
            </TabsContent>
          </Tabs>
        </TooltipProvider>
      </div>
    </div>
  );
}
