"use client";

import { useState, useEffect, useCallback } from "react";
import { DateTime } from "luxon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "./components/StatCard";
import { jobService, activityService, goalService } from "@/lib/db-services";
import { Job, Activity, Goal } from "@/lib/database";
import {
  TrendingUp,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";

type TimeRange = "today" | "week" | "month" | "all";

interface DashboardStats {
  applicationsCreated: number;
  applicationsApplied: number;
  interviews: number;
  offers: number;
  rejections: number;
  productiveActivities: number;
  totalApplications: number;
  statusBreakdown: Record<string, number>;
  chartData: Array<{
    date: string;
    [key: string]: string | number;
  }>;
}

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    applicationsCreated: 0,
    applicationsApplied: 0,
    interviews: 0,
    offers: 0,
    rejections: 0,
    productiveActivities: 0,
    totalApplications: 0,
    statusBreakdown: {},
    chartData: [],
  });
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback((range: TimeRange) => {
    const now = DateTime.now();
    const today = now.startOf("day");

    switch (range) {
      case "today":
        return {
          start: today.toJSDate(),
          end: today.endOf("day").toJSDate(),
        };
      case "week":
        const weekStart = today.startOf("week");
        return {
          start: weekStart.toJSDate(),
          end: now.toJSDate(),
        };
      case "month":
        const monthStart = today.startOf("month");
        return {
          start: monthStart.toJSDate(),
          end: now.toJSDate(),
        };
      case "all":
      default:
        return {
          start: DateTime.fromMillis(0).toJSDate(),
          end: now.toJSDate(),
        };
    }
  }, []);

  // Calculate the target goal for the current time period
  const calculateGoalForTimePeriod = useCallback(
    (goal: Goal, timeRange: TimeRange, start: Date, end: Date) => {
      if (!goal) return undefined;

      const { targetNumber, frequencyDays } = goal;

      // Calculate the number of days in the current time period
      const timePeriodDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Calculate how many complete frequency periods fit into the time period
      const frequencyPeriods = timePeriodDays / frequencyDays;

      // Calculate the target, rounded up
      return Math.ceil(targetNumber * frequencyPeriods);
    },
    []
  );

  const loadGoals = useCallback(async () => {
    try {
      const allGoals = await goalService.getAll();
      setGoals(allGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      let { start } = getDateRange(timeRange);
      const { end } = getDateRange(timeRange);

      // Get all jobs and activities
      const allJobs = await jobService.getAllIncludingArchived();
      const allActivities = await activityService.getAll();

      // For "all time", find the earliest data point and use that as start
      if (timeRange === "all") {
        const earliestJobDate = allJobs.reduce(
          (earliest, job) =>
            job.createdAt < earliest ? job.createdAt : earliest,
          new Date()
        );
        const earliestActivityDate = allActivities.reduce(
          (earliest, activity) =>
            activity.createdAt < earliest ? activity.createdAt : earliest,
          new Date()
        );

        const earliestDate =
          earliestJobDate < earliestActivityDate
            ? earliestJobDate
            : earliestActivityDate;

        // Only use earliest date if we actually have data, otherwise keep default
        if (allJobs.length > 0 || allActivities.length > 0) {
          start = DateTime.fromJSDate(earliestDate).startOf("day").toJSDate();
        }
      }

      // Filter jobs by creation date
      const jobsInRange = allJobs.filter(
        (job) => job.createdAt >= start && job.createdAt <= end
      );

      // Filter activities by date
      const statusChangeActivities = allActivities.filter(
        (activity) =>
          activity.type === "status_change" &&
          activity.createdAt >= start &&
          activity.createdAt <= end
      );

      // Calculate statistics
      const applicationsCreated = jobsInRange.length;

      // Count applications that were applied to (status changed to "applied" in time range)
      // Only count the specific status change activity where newStatus = "applied"
      const applicationsApplied = statusChangeActivities.filter(
        (activity) => activity.newStatus === "applied"
      ).length;

      // Count interviews (status changed to "interview")
      const interviewCount = statusChangeActivities.filter(
        (activity) => activity.newStatus === "interview"
      ).length;

      // Count offers (status changed to "offer")
      const offerCount = statusChangeActivities.filter(
        (activity) => activity.newStatus === "offer"
      ).length;

      // Count rejections (status changed to "rejected")
      const rejectionCount = statusChangeActivities.filter(
        (activity) => activity.newStatus === "rejected"
      ).length;

      // Calculate productive activities (created applications, status changes, and activities)
      const productiveActivitiesCount =
        applicationsCreated + // New applications created
        statusChangeActivities.length + // All status changes
        allActivities.filter(
          (activity) =>
            activity.type !== "status_change" &&
            activity.createdAt >= start &&
            activity.createdAt <= end
        ).length; // Other activities like emails, calls, etc.

      // Get current status breakdown of all jobs (not just in time range)
      const statusBreakdown: Record<string, number> = {};
      allJobs.forEach((job) => {
        if (!job.archived) {
          statusBreakdown[job.status] = (statusBreakdown[job.status] || 0) + 1;
        }
      });

      // Create day-by-day data for the chart within the selected time range
      const chartData = createDayByDayData(
        allJobs,
        allActivities,
        start,
        end,
        timeRange
      );

      setStats({
        applicationsCreated,
        applicationsApplied,
        interviews: interviewCount,
        offers: offerCount,
        rejections: rejectionCount,
        productiveActivities: productiveActivitiesCount,
        totalApplications: allJobs.filter((job) => !job.archived).length,
        statusBreakdown,
        chartData: chartData || [], // Ensure it's always an array
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, getDateRange]);

  // Helper function to create day-by-day status distribution
  const createDayByDayData = (
    jobs: Job[],
    activities: Activity[],
    start: Date,
    end: Date,
    timeRange: TimeRange
  ) => {
    const dayData: Record<string, Record<string, number>> = {};

    // Initialize all days in range using Luxon
    const startDate = DateTime.fromJSDate(start).startOf("day");
    const endDate = DateTime.fromJSDate(end).startOf("day");

    let currentDate = startDate;
    while (currentDate <= endDate) {
      const dateKey =
        currentDate.toISODate() || currentDate.toFormat("yyyy-MM-dd");
      dayData[dateKey] = {
        "Not Applied": 0,
        Applied: 0,
        Interview: 0,
        Offer: 0,
        Rejected: 0,
        Withdrawn: 0,
      };
      currentDate = currentDate.plus({ days: 1 });
    }

    // Track status of each job over time
    const jobStatuses: Record<number, string> = {};

    // Initialize with job creation dates and initial statuses
    jobs.forEach((job) => {
      if (job.id && job.createdAt >= start && job.createdAt <= end) {
        jobStatuses[job.id] = job.status;
        const dateKey =
          DateTime.fromJSDate(job.createdAt).toISODate() ||
          DateTime.fromJSDate(job.createdAt).toFormat("yyyy-MM-dd");
        if (dayData[dateKey]) {
          const statusLabel = formatStatusLabel(job.status);
          dayData[dateKey][statusLabel]++;
        }
      }
    });

    // Apply status changes chronologically
    const sortedActivities = activities
      .filter(
        (activity) =>
          activity.type === "status_change" &&
          activity.createdAt >= start &&
          activity.createdAt <= end &&
          activity.newStatus
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    sortedActivities.forEach((activity) => {
      const dateKey =
        DateTime.fromJSDate(activity.createdAt).toISODate() ||
        DateTime.fromJSDate(activity.createdAt).toFormat("yyyy-MM-dd");
      if (
        dayData[dateKey] &&
        activity.jobId &&
        activity.newStatus &&
        activity.previousStatus
      ) {
        // Remove from previous status
        const prevStatusLabel = formatStatusLabel(activity.previousStatus);
        if (dayData[dateKey][prevStatusLabel] > 0) {
          dayData[dateKey][prevStatusLabel]--;
        }

        // Add to new status
        const newStatusLabel = formatStatusLabel(activity.newStatus);
        dayData[dateKey][newStatusLabel]++;

        // Update job status tracking
        jobStatuses[activity.jobId] = activity.newStatus;
      }
    });

    // Convert to array format for recharts
    return Object.entries(dayData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, statuses]) => {
        const dateObj = DateTime.fromISO(date);
        let formattedDate: string;

        switch (timeRange) {
          case "today":
            formattedDate = dateObj.toFormat("HH:mm");
            break;
          case "week":
            formattedDate = dateObj.toFormat("ccc MMM d");
            break;
          case "month":
            formattedDate = dateObj.toFormat("MMM d");
            break;
          case "all":
          default:
            formattedDate = dateObj.toFormat("yy MMM d");
            break;
        }

        return {
          date: formattedDate,
          // Ensure all status values are numbers
          "Not Applied": Number(statuses["Not Applied"]) || 0,
          Applied: Number(statuses["Applied"]) || 0,
          Interview: Number(statuses["Interview"]) || 0,
          Offer: Number(statuses["Offer"]) || 0,
          Rejected: Number(statuses["Rejected"]) || 0,
          Withdrawn: Number(statuses["Withdrawn"]) || 0,
        };
      });
  };

  useEffect(() => {
    loadGoals();
    loadStats();
  }, [loadGoals, loadStats]);

  // Reload when timeRange changes
  useEffect(() => {
    loadStats();
  }, [timeRange, loadStats]);

  const formatTimeRangeLabel = (range: TimeRange) => {
    switch (range) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "all":
        return "All Time";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "not applied":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "applied":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "interview":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "offer":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "withdrawn":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const formatStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      "not applied": "Not Applied",
      applied: "Applied",
      interview: "Interview",
      offer: "Offer",
      rejected: "Rejected",
      withdrawn: "Withdrawn",
    };
    return (
      statusMap[status] ||
      status
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  const getChartColorByLabel = (statusLabel: string) => {
    const statusMap: Record<string, string> = {
      "Not Applied": "#6B7280",
      Applied: "#3B82F6",
      Interview: "#F59E0B",
      Offer: "#10B981",
      Rejected: "#EF4444",
      Withdrawn: "#8B5CF6",
    };
    return statusMap[statusLabel] || "#6B7280";
  };

  // Get all status keys for the areas
  const statusKeys = [
    "Not Applied",
    "Applied",
    "Interview",
    "Offer",
    "Rejected",
    "Withdrawn",
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Statistics (2 columns, 50% of total width) */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader className="animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Right side - Chart placeholder (50% of total width) */}
          <Card className="h-full">
            <CardHeader>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper function to get goal target for a specific metric
  const getGoalTarget = (goalType: string) => {
    // For "all time" timeframe, return undefined so StatCard uses current value as goal
    if (timeRange === "all") return undefined;

    const goal = goals.find((g) => g.type === goalType);
    if (!goal) return undefined;

    const { start, end } = getDateRange(timeRange);
    return calculateGoalForTimePeriod(goal, timeRange, start, end);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <Select
          value={timeRange}
          onValueChange={(value: TimeRange) => setTimeRange(value)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left side - Statistics (2 columns, 50% of total width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Productive Activities */}
          <StatCard
            title="Productive Activities"
            subtitle="All application statuses and activities"
            value={stats.productiveActivities}
            goal={getGoalTarget("productive_activities")}
            timeRangeLabel={formatTimeRangeLabel(timeRange).toLowerCase()}
            icon={Clock}
            variant="indigo"
          />

          {/* Applications Created */}
          <StatCard
            title="Applications Created"
            subtitle="Entered information but haven't applied"
            value={stats.applicationsCreated}
            goal={getGoalTarget("applications_created")}
            timeRangeLabel={formatTimeRangeLabel(timeRange).toLowerCase()}
            icon={FileText}
            variant="default"
          />

          {/* Applications Applied */}
          <StatCard
            title="Applications Applied"
            subtitle="Applications submitted to employer"
            value={stats.applicationsApplied}
            goal={getGoalTarget("applications_applied")}
            timeRangeLabel={formatTimeRangeLabel(timeRange).toLowerCase()}
            icon={TrendingUp}
            variant="blue"
          />

          {/* Interviews */}
          <StatCard
            title="Interviews"
            subtitle="Applications actively interviewing"
            value={stats.interviews}
            goal={getGoalTarget("interviews")}
            timeRangeLabel={formatTimeRangeLabel(timeRange).toLowerCase()}
            icon={Users}
            variant="yellow"
          />

          {/* Offers */}
          <StatCard
            title="Offers"
            subtitle="Received offer from employer"
            value={stats.offers}
            goal={getGoalTarget("offers")}
            timeRangeLabel={formatTimeRangeLabel(timeRange).toLowerCase()}
            icon={CheckCircle}
            variant="green"
          />

          {/* Rejections */}
          <StatCard
            title="Rejections"
            subtitle="Rejected by employer"
            value={stats.rejections}
            timeRangeLabel={formatTimeRangeLabel(timeRange).toLowerCase()}
            icon={XCircle}
            variant="red"
          />
        </div>

        {/* Right side - Status Distribution Chart (50% of total width) */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.chartData.length > 0 && statusKeys.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={stats.chartData}
                  stackOffset="expand"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                  />
                  <RechartsTooltip
                    formatter={(value: any, name: any) => [
                      `${value} applications`,
                      name,
                    ]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend />
                  {statusKeys
                    .filter((status) =>
                      stats.chartData.some(
                        (dataPoint) =>
                          dataPoint[status] !== undefined &&
                          typeof dataPoint[status] === "number" &&
                          !isNaN(Number(dataPoint[status]))
                      )
                    )
                    .map((status) => (
                      <Area
                        key={status}
                        type="monotone"
                        dataKey={status}
                        fill={getChartColorByLabel(status)}
                      />
                    ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No applications to display</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
