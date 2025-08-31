"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Hash, Target } from "lucide-react";
import { KeywordStats } from "./components/KeywordStats";

type ViewMode = "popular" | "targeted";

export default function StatsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("popular");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Keyword Statistics</h2>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "popular" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("popular")}
            className="flex items-center gap-2"
          >
            <Hash className="h-4 w-4" />
            Popular
          </Button>
          <Button
            variant={viewMode === "targeted" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("targeted")}
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Targeted
          </Button>
        </div>
      </div>
      <KeywordStats viewMode={viewMode} />
    </div>
  );
}
