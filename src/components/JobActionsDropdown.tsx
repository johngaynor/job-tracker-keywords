"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobViewDialog } from "@/components/JobViewDialog";
import { ActivityLogDialog } from "@/components/ActivityLogDialog";
import { JobUpdateDialog } from "@/components/JobUpdateDialog";
import { Job, Keyword, Employer } from "@/lib/database";
import { MoreVertical, Eye, FileText, Edit, Trash2 } from "lucide-react";

interface JobActionsDropdownProps {
  job: Job & { employer: Employer; keywords: Keyword[] };
  onJobUpdated: () => void;
  onDeleteJob: (jobId: number) => void;
}

export function JobActionsDropdown({ job, onJobUpdated, onDeleteJob }: JobActionsDropdownProps) {
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setViewDialogOpen(true)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActivityDialogOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Activity Log
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setUpdateDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Update Status
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => onDeleteJob(job.id!)}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Controlled Dialogs */}
      <JobViewDialog 
        job={job} 
        open={viewDialogOpen} 
        onOpenChange={setViewDialogOpen} 
      />
      <ActivityLogDialog 
        job={job} 
        open={activityDialogOpen} 
        onOpenChange={setActivityDialogOpen} 
      />
      <JobUpdateDialog 
        job={job} 
        onJobUpdated={onJobUpdated}
        open={updateDialogOpen} 
        onOpenChange={setUpdateDialogOpen} 
      />
    </>
  );
}
