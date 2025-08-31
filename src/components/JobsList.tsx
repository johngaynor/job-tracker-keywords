"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { JobsKanban } from "@/components/JobsKanban";
import { JobsTable } from "@/components/JobsTable";
import { Table, Columns } from "lucide-react";

export function JobsList() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Job Applications</h2>
          {/* Show archived checkbox - visible on mobile, hidden on desktop */}
          <div className="flex items-center space-x-2 sm:hidden">
            <Checkbox
              id="show-archived-mobile"
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(!!checked)}
            />
            <label
              htmlFor="show-archived-mobile"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Show archived jobs
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          {/* Show archived checkbox - hidden on mobile, visible on desktop */}
          <div className="hidden sm:flex items-center space-x-2 mb-1 sm:mb-0">
            <Checkbox
              id="show-archived-desktop"
              checked={showArchived}
              onCheckedChange={(checked) => setShowArchived(!!checked)}
            />
            <label
              htmlFor="show-archived-desktop"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 whitespace-nowrap"
            >
              Show archived jobs
            </label>
          </div>
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

      {viewMode === "kanban" ? (
        <JobsKanban showArchived={showArchived} />
      ) : (
        <JobsTable showArchived={showArchived} />
      )}
    </div>
  );
}
