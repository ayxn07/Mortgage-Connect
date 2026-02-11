"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

const PIE_COLORS = [
  "#18181b",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#6366f1",
  "#10b981",
  "#ef4444",
  "#22c55e",
];

export default function AnalyticsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [applications, setApplications] = useState<MortgageApplication[]>([]);
  const [tickets, setTickets] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Top agents by rating
  const topAgents = useMemo(() => {
    return [...agents]
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
      .slice(0, 5);
  }, [agents]);

  // Total property value
  const totalPropertyValue = useMemo(() => {
    return applications.reduce(
      (sum, app) => sum + (app.propertyDetails?.propertyPrice || 0),
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
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{users.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Agents</p>
                <p className="text-3xl font-bold">{agents.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Applications</p>
                <p className="text-3xl font-bold">{applications.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Property Value
                </p>
                <p className="text-2xl font-bold">
                  AED {(totalPropertyValue / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {statusData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {roleData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
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
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="users"
                  name="New Users"
                  fill="#18181b"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="applications"
                  name="Applications"
                  fill="#a1a1aa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      fontSize={12}
                      width={80}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="value"
                      name="Tickets"
                      fill="#18181b"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
