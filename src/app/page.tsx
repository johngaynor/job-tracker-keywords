"use client";

import { useState, useEffect, useCallback } from "react";
import { DateTime } from "luxon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

type TimeRange =
  | "today"
  | "week"
  | "last7days"
  | "month"
  | "last30days"
  | "all";

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
  const [timeRange, setTimeRange] = useState<TimeRange>("last7days");
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
      case "last7days":
        const last7DaysStart = now.minus({ days: 6 }).startOf("day");
        return {
          start: last7DaysStart.toJSDate(),
          end: now.toJSDate(),
        };
      case "month":
        const monthStart = today.startOf("month");
        return {
          start: monthStart.toJSDate(),
          end: now.toJSDate(),
        };
      case "last30days":
        const last30DaysStart = now.minus({ days: 29 }).startOf("day");
        return {
          start: last30DaysStart.toJSDate(),
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

  // Helper function to create cumulative day-by-day data for applications
  const createDayByDayData = (
    jobs: Job[],
    activities: Activity[],
    start: Date,
    end: Date,
    timeRange: TimeRange
  ) => {
    // Initialize all days in range
    const startDate = DateTime.fromJSDate(start).startOf("day");
    const endDate = DateTime.fromJSDate(end).startOf("day");

    const dailyData: Array<{
      date: string;
      formattedDate: string;
      applicationsCreated: number;
      applicationsApplied: number;
      interviews: number;
      offers: number;
      rejections: number;
    }> = [];

    let currentDate = startDate;
    while (currentDate <= endDate) {
      const dateKey =
        currentDate.toISODate() || currentDate.toFormat("yyyy-MM-dd");

      let formattedDate: string;
      switch (timeRange) {
        case "today":
          formattedDate = currentDate.toFormat("HH:mm");
          break;
        case "week":
          formattedDate = currentDate.toFormat("ccc MMM d");
          break;
        case "last7days":
          formattedDate = currentDate.toFormat("ccc MMM d");
          break;
        case "month":
          formattedDate = currentDate.toFormat("MMM d");
          break;
        case "last30days":
          formattedDate = currentDate.toFormat("MMM d");
          break;
        case "all":
        default:
          formattedDate = currentDate.toFormat("yy MMM d");
          break;
      }

      dailyData.push({
        date: dateKey,
        formattedDate,
        applicationsCreated: 0,
        applicationsApplied: 0,
        interviews: 0,
        offers: 0,
        rejections: 0,
      });

      currentDate = currentDate.plus({ days: 1 });
    }

    // Count jobs created each day
    jobs.forEach((job) => {
      // Use date comparison at the day level rather than exact timestamp
      const jobDate = DateTime.fromJSDate(job.createdAt).startOf("day");
      const startDate = DateTime.fromJSDate(start).startOf("day");
      const endDate = DateTime.fromJSDate(end).startOf("day");

      // Check if job date is within range (inclusive)
      if (jobDate >= startDate && jobDate <= endDate) {
        const dateKey = jobDate.toISODate() || jobDate.toFormat("yyyy-MM-dd");
        const dayIndex = dailyData.findIndex((d) => d.date === dateKey);
        if (dayIndex >= 0) {
          dailyData[dayIndex].applicationsCreated++;
        }
      }
    });

    // Count applications applied each day (status changes to "applied")
    activities
      .filter(
        (activity) =>
          activity.type === "status_change" && activity.newStatus === "applied"
      )
      .forEach((activity) => {
        const activityDate = DateTime.fromJSDate(activity.createdAt).startOf(
          "day"
        );
        const startDate = DateTime.fromJSDate(start).startOf("day");
        const endDate = DateTime.fromJSDate(end).startOf("day");

        if (activityDate >= startDate && activityDate <= endDate) {
          const dateKey =
            activityDate.toISODate() || activityDate.toFormat("yyyy-MM-dd");
          const dayIndex = dailyData.findIndex((d) => d.date === dateKey);
          if (dayIndex >= 0) {
            dailyData[dayIndex].applicationsApplied++;
          }
        }
      });

    // Count interviews each day (status changes to "interview")
    activities
      .filter(
        (activity) =>
          activity.type === "status_change" &&
          activity.newStatus === "interview"
      )
      .forEach((activity) => {
        const activityDate = DateTime.fromJSDate(activity.createdAt).startOf(
          "day"
        );
        const startDate = DateTime.fromJSDate(start).startOf("day");
        const endDate = DateTime.fromJSDate(end).startOf("day");

        if (activityDate >= startDate && activityDate <= endDate) {
          const dateKey =
            activityDate.toISODate() || activityDate.toFormat("yyyy-MM-dd");
          const dayIndex = dailyData.findIndex((d) => d.date === dateKey);
          if (dayIndex >= 0) {
            dailyData[dayIndex].interviews++;
          }
        }
      });

    // Count offers each day (status changes to "offer")
    activities
      .filter(
        (activity) =>
          activity.type === "status_change" && activity.newStatus === "offer"
      )
      .forEach((activity) => {
        const activityDate = DateTime.fromJSDate(activity.createdAt).startOf(
          "day"
        );
        const startDate = DateTime.fromJSDate(start).startOf("day");
        const endDate = DateTime.fromJSDate(end).startOf("day");

        if (activityDate >= startDate && activityDate <= endDate) {
          const dateKey =
            activityDate.toISODate() || activityDate.toFormat("yyyy-MM-dd");
          const dayIndex = dailyData.findIndex((d) => d.date === dateKey);
          if (dayIndex >= 0) {
            dailyData[dayIndex].offers++;
          }
        }
      });

    // Count rejections each day (status changes to "rejected")
    activities
      .filter(
        (activity) =>
          activity.type === "status_change" && activity.newStatus === "rejected"
      )
      .forEach((activity) => {
        const activityDate = DateTime.fromJSDate(activity.createdAt).startOf(
          "day"
        );
        const startDate = DateTime.fromJSDate(start).startOf("day");
        const endDate = DateTime.fromJSDate(end).startOf("day");

        if (activityDate >= startDate && activityDate <= endDate) {
          const dateKey =
            activityDate.toISODate() || activityDate.toFormat("yyyy-MM-dd");
          const dayIndex = dailyData.findIndex((d) => d.date === dateKey);
          if (dayIndex >= 0) {
            dailyData[dayIndex].rejections++;
          }
        }
      });

    // Convert to cumulative data
    let cumulativeCreated = 0;
    let cumulativeApplied = 0;
    let cumulativeInterviews = 0;
    let cumulativeOffers = 0;
    let cumulativeRejections = 0;

    return dailyData.map((day) => {
      cumulativeCreated += day.applicationsCreated;
      cumulativeApplied += day.applicationsApplied;
      cumulativeInterviews += day.interviews;
      cumulativeOffers += day.offers;
      cumulativeRejections += day.rejections;

      return {
        date: day.formattedDate,
        "Applications Created": cumulativeCreated,
        "Applications Applied": cumulativeApplied,
        Interviews: cumulativeInterviews,
        Offers: cumulativeOffers,
        Rejections: cumulativeRejections,
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

  const formatTimeRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "last7days":
        return "Last 7 Days";
      case "month":
        return "This Month";
      case "last30days":
        return "Last 30 Days";
      case "all":
        return "All Time";
    }
  };

  // Chart keys for the new cumulative chart
  const chartKeys = [
    "Applications Created",
    "Applications Applied",
    "Interviews",
    "Offers",
    "Rejections",
  ];

  const getChartColor = (key: string) => {
    switch (key) {
      case "Applications Created":
        return "#6B7280"; // Gray for created
      case "Applications Applied":
        return "#3B82F6"; // Blue for applied
      case "Interviews":
        return "#F59E0B"; // Amber for interviews
      case "Offers":
        return "#10B981"; // Emerald for offers
      case "Rejections":
        return "#EF4444"; // Red for rejections
      default:
        return "#6B7280";
    }
  };

  // Custom legend renderer to ensure colors match
  const renderCustomLegend = (props: any) => {
    const { payload } = props;

    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getChartColor(entry.value) }}
            />
            <span className="text-sm text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

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
            <SelectItem value="last7days">Last 7 Days</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="last30days">Last 30 Days</SelectItem>
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

        {/* Right side - Cumulative Applications Chart (50% of total width) */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Cumulative Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={stats.chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value: any, name: any) => [
                      `${value} applications`,
                      name,
                    ]}
                    labelFormatter={(label: any) => `${label}`}
                  />
                  <Legend
                    content={renderCustomLegend}
                    wrapperStyle={{
                      paddingTop: "20px",
                    }}
                  />
                  {chartKeys.map((key) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      fill={getChartColor(key)}
                      stroke={getChartColor(key)}
                      stackId="1"
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

            {/* Final count badges */}
            {stats.chartData.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Current Totals
                </h4>
                <div className="flex flex-wrap gap-3">
                  {chartKeys.map((key) => {
                    const lastDataPoint =
                      stats.chartData[stats.chartData.length - 1];
                    const count = lastDataPoint[key] || 0;
                    return (
                      <Badge
                        key={key}
                        variant="outline"
                        className="px-3 py-2 text-sm font-medium border-2"
                        style={{
                          borderColor: getChartColor(key),
                          color: getChartColor(key),
                          backgroundColor: `${getChartColor(key)}10`, // 10% opacity background
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: getChartColor(key) }}
                        />
                        {key}: {count}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
