"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JobViewDialog } from "./JobViewDialog";
import { ActivityLogDialog } from "./ActivityLogDialog";
import { JobUpdateDialog } from "./JobUpdateDialog";
import { Job, Keyword, Employer } from "@/lib/database";
import { MoreVertical, Eye, FileText, Edit, Trash2 } from "lucide-react";

interface JobActionsDropdownProps {
  job: Job & { employer: Employer; keywords: Keyword[] };
  onJobUpdated: () => void;
  onDeleteJob: (jobId: number) => void;
}

export function JobActionsDropdown({
  job,
  onJobUpdated,
  onDeleteJob,
}: JobActionsDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <JobViewDialog job={job}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
        </JobViewDialog>

        <ActivityLogDialog job={job}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <FileText className="h-4 w-4 mr-2" />
            Activity Log
          </DropdownMenuItem>
        </ActivityLogDialog>

        <JobUpdateDialog job={job} onJobUpdated={onJobUpdated}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Edit className="h-4 w-4 mr-2" />
            Update Status
          </DropdownMenuItem>
        </JobUpdateDialog>

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
  );
}
