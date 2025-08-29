"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { JobsKanban } from "@/components/JobsKanban";
import { JobsTable } from "@/components/JobsTable";
import { Table, Columns } from "lucide-react";

export function JobsList() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Job Applications</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="flex items-center gap-2"
          >
            <Table className="h-4 w-4" />
            Table
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            className="flex items-center gap-2"
          >
            <Columns className="h-4 w-4" />
            Kanban
          </Button>
        </div>
      </div>

      {viewMode === "kanban" ? <JobsKanban /> : <JobsTable />}
    </div>
  );
}
