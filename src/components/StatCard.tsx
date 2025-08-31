import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  subtitle: string;
  value: number;
  goal?: number; // Optional goal target for the time period
  timeRangeLabel: string;
  icon: LucideIcon;
  variant?: "default" | "blue" | "yellow" | "green" | "red" | "indigo";
}

const getVariantStyles = (variant: StatCardProps["variant"]) => {
  switch (variant) {
    case "blue":
      return {
        card: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
        title: "text-blue-700 dark:text-blue-300",
        subtitle: "text-blue-600 dark:text-blue-400",
        value: "text-blue-900 dark:text-blue-100",
        timeRange: "text-blue-600 dark:text-blue-400",
        icon: "text-blue-500",
        progress: "[&>div]:bg-blue-500 dark:[&>div]:bg-blue-400",
      };
    case "yellow":
      return {
        card: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800",
        title: "text-yellow-700 dark:text-yellow-300",
        subtitle: "text-yellow-600 dark:text-yellow-400",
        value: "text-yellow-900 dark:text-yellow-100",
        timeRange: "text-yellow-600 dark:text-yellow-400",
        icon: "text-yellow-500",
        progress: "[&>div]:bg-yellow-500 dark:[&>div]:bg-yellow-400",
      };
    case "green":
      return {
        card: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
        title: "text-green-700 dark:text-green-300",
        subtitle: "text-green-600 dark:text-green-400",
        value: "text-green-900 dark:text-green-100",
        timeRange: "text-green-600 dark:text-green-400",
        icon: "text-green-500",
        progress: "[&>div]:bg-green-500 dark:[&>div]:bg-green-400",
      };
    case "red":
      return {
        card: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
        title: "text-red-700 dark:text-red-300",
        subtitle: "text-red-600 dark:text-red-400",
        value: "text-red-900 dark:text-red-100",
        timeRange: "text-red-600 dark:text-red-400",
        icon: "text-red-500",
        progress: "[&>div]:bg-red-500 dark:[&>div]:bg-red-400",
      };
    case "indigo":
      return {
        card: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800",
        title: "text-indigo-700 dark:text-indigo-300",
        subtitle: "text-indigo-600 dark:text-indigo-400",
        value: "text-indigo-900 dark:text-indigo-100",
        timeRange: "text-indigo-600 dark:text-indigo-400",
        icon: "text-indigo-500",
        progress: "[&>div]:bg-indigo-500 dark:[&>div]:bg-indigo-400",
      };
    default:
      return {
        card: "",
        title: "text-sm font-medium text-gray-700 dark:text-gray-300",
        subtitle: "text-muted-foreground",
        value: "text-gray-900 dark:text-gray-100",
        timeRange: "text-muted-foreground",
        icon: "text-muted-foreground",
        progress: "[&>div]:bg-gray-500 dark:[&>div]:bg-gray-400",
      };
  }
};

export function StatCard({
  title,
  subtitle,
  value,
  goal,
  timeRangeLabel,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  const styles = getVariantStyles(variant);
  const displayGoal = goal ?? value; // Use value as goal if no goal is provided
  const progressPercentage = displayGoal > 0 ? Math.min((value / displayGoal) * 100, 100) : 0;

  return (
    <Card className={styles.card}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className={`text-sm font-medium ${styles.title}`}>
            {title}
          </CardTitle>
          <p className={`text-xs mt-1 ${styles.subtitle}`}>{subtitle}</p>
        </div>
        <Icon className={`h-4 w-4 ${styles.icon}`} />
      </CardHeader>
      <CardContent>
        <div className={`flex items-baseline gap-2 ${styles.value}`}>
          <span className="text-4xl font-bold">{value}</span>
          <span className="text-2xl font-medium opacity-70">
            / {displayGoal}
          </span>
        </div>
        <p className={`text-xs pt-2 ${styles.timeRange}`}>{timeRangeLabel}</p>
        <div className="mt-2">
          <Progress 
            value={progressPercentage} 
            className={`h-1 ${styles.progress}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
