"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserCheck,
  FileText,
  HeadphonesIcon,
  TrendingUp,
  Star,
  Loader2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  fetchAllUsers,
  fetchAllAgents,
  fetchAllApplications,
  fetchAllSupportQueries,
} from "@/lib/firestore";
import {
  User,
  Agent,
  MortgageApplication,
  SupportQuery,
} from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Label,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { useTheme } from "@/lib/theme-context";
import { getThemeColor } from "@/lib/theme-config";

export default function AnalyticsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [applications, setApplications] = useState<MortgageApplication[]>([]);
  const [tickets, setTickets] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const { themeColor, theme } = useTheme();

  useEffect(() => {
    async function load() {
      try {
        const [u, a, apps, t] = await Promise.all([
          fetchAllUsers(),
          fetchAllAgents(),
          fetchAllApplications(),
          fetchAllSupportQueries(),
        ]);
        setUsers(u);
        setAgents(a);
        setApplications(apps);
        setTickets(t);
      } catch (err) {
        console.error("Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Application status breakdown
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      const label = app.status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [applications]);

  // User role breakdown
  const roleData = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const label = u.role.charAt(0).toUpperCase() + u.role.slice(1);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  // Chart colors based on theme
  const chartColors = useMemo(() => {
    const primaryColor = getThemeColor(themeColor, theme);
    
    if (themeColor === 'adaptive') {
      return [
        "#667eea",
        "#764ba2", 
        "#f093fb",
        "#4facfe",
        "#43e97b",
        "#fa709a",
        "#fee140",
        "#30cfd0",
      ];
    }
    
    // Generate shades of the primary color
    return [
      primaryColor,
      `${primaryColor}dd`,
      `${primaryColor}bb`,
      `${primaryColor}99`,
      `${primaryColor}77`,
      `${primaryColor}55`,
      `${primaryColor}33`,
      `${primaryColor}22`,
    ];
  }, [themeColor, theme]);

  // Chart config for status
  const statusChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    statusData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: chartColors[index % chartColors.length],
      };
    });
    return config;
  }, [statusData, chartColors]);

  // Chart config for roles
  const roleChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    roleData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: chartColors[index % chartColors.length],
      };
    });
    return config;
  }, [roleData, chartColors]);

  // Chart config for monthly growth
  const monthlyChartConfig: ChartConfig = useMemo(() => ({
    users: {
      label: "New Users",
      color: themeColor === 'adaptive' ? "#667eea" : getThemeColor(themeColor, theme),
    },
    applications: {
      label: "Applications",
      color: themeColor === 'adaptive' ? "#764ba2" : `${getThemeColor(themeColor, theme)}99`,
    },
  }), [themeColor, theme]);

  // Monthly user growth (last 6 months)
  const monthlyGrowth = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const label = format(monthDate, "MMM yyyy");

      const usersInMonth = users.filter((u) => {
        if (!u.createdAt?.toDate) return false;
        const d = u.createdAt.toDate();
        return isWithinInterval(d, { start, end });
      }).length;

      const appsInMonth = applications.filter((a) => {
        if (!a.createdAt?.toDate) return false;
        const d = a.createdAt.toDate();
        return isWithinInterval(d, { start, end });
      }).length;

      months.push({ month: label, users: usersInMonth, applications: appsInMonth });
    }
    return months;
  }, [users, applications]);

  // Support category breakdown
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    tickets.forEach((t) => {
      const label = t.category.charAt(0).toUpperCase() + t.category.slice(1);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [tickets]);

  // Chart config for categories
  const categoryChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    categoryData.forEach((item, index) => {
      config[item.name] = {
        label: item.name,
        color: chartColors[index % chartColors.length],
      };
    });
    return config;
  }, [categoryData, chartColors]);

  // Top agents by rating
  const topAgents = useMemo(() => {
    return [...agents]
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, 5);
  }, [agents]);

  // Total property value
  const totalPropertyValue = useMemo(() => {
    return applications.reduce(
      (sum, app) => sum + (app.propertyDetails?.purchasePrice || 0),
      0
    );
  }, [applications]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Platform metrics and insights
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${themeColor === 'adaptive' ? 'bg-muted' : 'bg-primary/10'}`}>
                <Users className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-3xl font-bold">{agents.length}</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${themeColor === 'adaptive' ? 'bg-muted' : 'bg-primary/10'}`}>
                <UserCheck className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-3xl font-bold">{applications.length}</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${themeColor === 'adaptive' ? 'bg-muted' : 'bg-primary/10'}`}>
                <FileText className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Property Value
                </p>
                <p className="text-2xl font-bold">
                  AED {(totalPropertyValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${themeColor === 'adaptive' ? 'bg-muted' : 'bg-primary/10'}`}>
                <TrendingUp className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-muted-foreground' : 'text-primary'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Application Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Status</CardTitle>
            <CardDescription>
              Breakdown of all mortgage applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No application data
              </p>
            ) : (
              <ChartContainer config={statusChartConfig} className="h-[300px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* User Roles Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Roles</CardTitle>
            <CardDescription>Distribution by role</CardDescription>
          </CardHeader>
          <CardContent>
            {roleData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No user data
              </p>
            ) : (
              <ChartContainer config={roleChartConfig} className="h-[300px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={roleData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {roleData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Growth</CardTitle>
          <CardDescription>
            New users and applications over the last 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={monthlyChartConfig} className="h-[350px]">
            <BarChart data={monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="users"
                fill="var(--color-users)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="applications"
                fill="var(--color-applications)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Rated Agents</CardTitle>
            <CardDescription>By average rating</CardDescription>
          </CardHeader>
          <CardContent>
            {topAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No agents yet
              </p>
            ) : (
              <div className="space-y-4">
                {topAgents.map((agent, idx) => (
                  <div
                    key={agent.uid}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {agent.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {agent.location} &middot; {agent.completedProjects}{" "}
                          projects
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">
                        {agent.avgRating?.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({agent.reviewCount})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Support Categories</CardTitle>
            <CardDescription>Ticket distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No support tickets
              </p>
            ) : (
              <ChartContainer config={categoryChartConfig} className="h-[250px]">
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={12}
                    width={80}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
