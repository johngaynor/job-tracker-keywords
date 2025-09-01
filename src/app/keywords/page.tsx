"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, FileSearch } from "lucide-react";
import { KeywordStats } from "./components/KeywordStats";

type ViewMode = "user" | "application";

export default function KeywordsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("application");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Keywords</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "user" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("user")}
            className="flex items-center gap-2"
          >
            <User className="h-4 w-4" />
            User
          </Button>
          <Button
            variant={viewMode === "application" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("application")}
            className="flex items-center gap-2"
          >
            <FileSearch className="h-4 w-4" />
            Applications
          </Button>
        </div>
      </div>
      <KeywordStats viewMode={viewMode} />
    </div>
  );
}
