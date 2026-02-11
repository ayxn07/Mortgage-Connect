"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  UserCheck,
  FileText,
  HeadphonesIcon,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageCircle,
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  Star,
  Activity,
  UserPlus,
  Shield,
  Briefcase,
} from "lucide-react";
import {
  fetchEnhancedDashboardStats,
  fetchRecentUsers,
  fetchActiveAgents,
  fetchAllApplications,
  fetchAllSupportQueries,
} from "@/lib/firestore";
import type {
  EnhancedDashboardStats,
} from "@/lib/firestore";
import type {
  User,
  Agent,
  MortgageApplication,
  SupportQuery,
} from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";

export default function DashboardPage() {
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [recentApps, setRecentApps] = useState<MortgageApplication[]>([]);
  const [recentTickets, setRecentTickets] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, users, agentList, apps, tickets] = await Promise.all([
          fetchEnhancedDashboardStats(),
          fetchRecentUsers(8),
          fetchActiveAgents(),
          fetchAllApplications(),
          fetchAllSupportQueries(),
        ]);
        setStats(s);
        setRecentUsers(users);
        setAgents(agentList.slice(0, 4));
        setRecentApps(apps.slice(0, 5));
        setRecentTickets(tickets.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pre_approval: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    property_valuation: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    bank_approval: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    offer_letter: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    disbursement: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  const supportStatusColors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    closed: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  };

  const roleIcons: Record<string, React.ElementType> = {
    user: Users,
    agent: Briefcase,
    admin: Shield,
  };

  const roleColors: Record<string, string> = {
    user: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    agent: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your MortgageConnect platform
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium">{format(new Date(), "EEEE")}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(), "MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Primary Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsers ?? 0}</div>
            <div className="flex items-center gap-1 mt-1">
              <UserPlus className="h-3 w-3 text-green-500" />
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                +{stats?.recentUsersCount ?? 0} this week
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Agents
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <UserCheck className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeAgents ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {stats?.totalAgents ?? 0} total agents
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Applications
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.totalApplications ?? 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.pendingApplications ?? 0} pending review
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Support & Chats
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <HeadphonesIcon className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.totalSupportTickets ?? 0}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">
                {stats?.openTickets ?? 0} open
              </p>
              <span className="text-muted-foreground">|</span>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {stats?.totalChats ?? 0} chats
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Application Pipeline + User Role Breakdown */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Application Pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Application Pipeline</CardTitle>
              <CardDescription>
                Current status of all mortgage applications
              </CardDescription>
            </div>
            <Link href="/dashboard/applications">
              <Button variant="ghost" size="sm">
                View All <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Pending",
                  count: stats?.pendingApplications ?? 0,
                  icon: Clock,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                  circleBg: "bg-amber-500/20",
                },
                {
                  label: "Approved",
                  count: stats?.approvedApplications ?? 0,
                  icon: CheckCircle2,
                  color: "text-green-500",
                  bg: "bg-green-500/10",
                  circleBg: "bg-green-500/20",
                },
                {
                  label: "Rejected",
                  count: stats?.rejectedApplications ?? 0,
                  icon: XCircle,
                  color: "text-red-500",
                  bg: "bg-red-500/10",
                  circleBg: "bg-red-500/20",
                },
                {
                  label: "In Progress",
                  count:
                    (stats?.applicationsByStatus?.["bank_approval"] ?? 0) +
                    (stats?.applicationsByStatus?.["property_valuation"] ?? 0),
                  icon: Activity,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                  circleBg: "bg-blue-500/20",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex flex-col justify-between p-4 rounded-2xl border transition-all hover:shadow-md ${item.bg} border-transparent dark:border-white/5 h-full min-h-[140px]`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-12 w-12 rounded-full ${item.circleBg} flex items-center justify-center shrink-0`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-4xl font-bold mb-1">{item.count}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Status Breakdown Bar */}
            {stats && stats.totalApplications > 0 && (
              <div className="mt-4">
                <div className="flex rounded-full h-2.5 overflow-hidden bg-muted">
                  {Object.entries(stats.applicationsByStatus).map(
                    ([status, count]) => {
                      const pct = (count / stats.totalApplications) * 100;
                      const colors: Record<string, string> = {
                        draft: "bg-gray-400",
                        submitted: "bg-blue-500",
                        pre_approval: "bg-amber-500",
                        property_valuation: "bg-purple-500",
                        bank_approval: "bg-indigo-500",
                        offer_letter: "bg-emerald-500",
                        disbursement: "bg-green-500",
                        rejected: "bg-red-500",
                        completed: "bg-green-600",
                      };
                      return (
                        <div
                          key={status}
                          className={`${colors[status] || "bg-gray-400"} transition-all`}
                          style={{ width: `${pct}%` }}
                          title={`${status.replace(/_/g, " ")}: ${count}`}
                        />
                      );
                    }
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {Object.entries(stats.applicationsByStatus).map(
                    ([status, count]) => (
                      <div
                        key={status}
                        className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${
                            {
                              draft: "bg-gray-400",
                              submitted: "bg-blue-500",
                              pre_approval: "bg-amber-500",
                              property_valuation: "bg-purple-500",
                              bank_approval: "bg-indigo-500",
                              offer_letter: "bg-emerald-500",
                              disbursement: "bg-green-500",
                              rejected: "bg-red-500",
                              completed: "bg-green-600",
                            }[status] || "bg-gray-400"
                          }`}
                        />
                        {status.replace(/_/g, " ")} ({count})
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users by Role</CardTitle>
            <CardDescription>Breakdown of user types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats &&
              Object.entries(stats.usersByRole).map(([role, count]) => {
                const Icon = roleIcons[role] || Users;
                const pct =
                  stats.totalUsers > 0
                    ? Math.round((count / stats.totalUsers) * 100)
                    : 0;
                return (
                  <div key={role}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-7 w-7 rounded-md flex items-center justify-center ${
                            roleColors[role] || "bg-muted"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm font-medium capitalize">
                          {role}s
                        </span>
                      </div>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            {
                              user: "bg-blue-500",
                              agent: "bg-purple-500",
                              admin: "bg-red-500",
                            }[role] || "bg-primary"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Recent Users</h2>
            <p className="text-sm text-muted-foreground">
              Newest accounts on the platform
            </p>
          </div>
          <Link href="/dashboard/users">
            <Button variant="outline" size="sm">
              View All <ArrowUpRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentUsers.map((user) => (
            <Card
              key={user.uid}
              className="group hover:shadow-lg hover:border-primary/20 transition-all"
            >
              <CardContent className="pt-6">
                {/* User Header */}
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {user.displayName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {user.displayName || "Unnamed"}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] mt-0.5 ${
                        roleColors[user.role] || ""
                      }`}
                    >
                      {user.role}
                    </Badge>
                  </div>
                </div>

                <Separator className="mb-3" />

                {/* User Details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>
                      Joined{" "}
                      {user.createdAt?.toDate
                        ? formatDistanceToNow(user.createdAt.toDate(), {
                            addSuffix: true,
                          })
                        : "recently"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Agents Cards */}
      {agents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Top Agents</h2>
              <p className="text-sm text-muted-foreground">
                Highest-rated mortgage agents
              </p>
            </div>
            <Link href="/dashboard/agents">
              <Button variant="outline" size="sm">
                View All <ArrowUpRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {agents
              .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
              .map((agent) => (
                <Card
                  key={agent.uid}
                  className="group hover:shadow-lg hover:border-primary/20 transition-all"
                >
                  <CardContent className="pt-6">
                    {/* Agent Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-purple-500/10 text-purple-600 font-semibold text-sm">
                          {agent.displayName?.charAt(0)?.toUpperCase() || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                          {agent.displayName || "Agent"}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-medium">
                            {agent.avgRating?.toFixed(1) || "0.0"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            ({agent.totalReviews || 0})
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={agent.availability ? "default" : "secondary"}
                        className={`text-[10px] ${
                          agent.availability
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : ""
                        }`}
                      >
                        {agent.availability ? "Online" : "Offline"}
                      </Badge>
                    </div>

                    <Separator className="mb-3" />

                    {/* Agent Details */}
                    <div className="space-y-2">
                      {agent.specialty?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {agent.specialty.slice(0, 2).map((s) => (
                            <Badge
                              key={s}
                              variant="outline"
                              className="text-[10px]"
                            >
                              {s}
                            </Badge>
                          ))}
                          {agent.specialty.length > 2 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{agent.specialty.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-sm font-bold">
                            {agent.completedProjects || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Projects
                          </p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-sm font-bold">
                            {agent.experience || 0}yr
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Experience
                          </p>
                        </div>
                      </div>
                      {agent.location && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{agent.location}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* Recent Activity - Applications & Support */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Applications</CardTitle>
              <CardDescription>Latest mortgage applications</CardDescription>
            </div>
            <Link href="/dashboard/applications">
              <Button variant="ghost" size="sm">
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentApps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No applications yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentApps.map((app) => (
                  <div
                    key={app.applicationId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-blue-500/10 text-blue-600">
                        {app.applicantIdentity?.fullName
                          ?.charAt(0)
                          ?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {app.applicantIdentity?.fullName || "Unknown"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {app.propertyDetails?.propertyType || "N/A"} &middot;
                        AED{" "}
                        {app.propertyDetails?.propertyPrice?.toLocaleString() ||
                          "0"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${statusColors[app.status] || ""}`}
                      >
                        {app.status.replace(/_/g, " ")}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {app.createdAt?.toDate
                          ? formatDistanceToNow(app.createdAt.toDate(), {
                              addSuffix: true,
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Support Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Support Tickets</CardTitle>
              <CardDescription>Latest user queries</CardDescription>
            </div>
            <Link href="/dashboard/support">
              <Button variant="ghost" size="sm">
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No support tickets yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.queryId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        ticket.status === "open"
                          ? "bg-blue-500/10"
                          : ticket.status === "in_progress"
                          ? "bg-amber-500/10"
                          : "bg-green-500/10"
                      }`}
                    >
                      <HeadphonesIcon
                        className={`h-4 w-4 ${
                          ticket.status === "open"
                            ? "text-blue-500"
                            : ticket.status === "in_progress"
                            ? "text-amber-500"
                            : "text-green-500"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {ticket.subject}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {ticket.name} &middot; {ticket.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          supportStatusColors[ticket.status] || ""
                        }`}
                      >
                        {ticket.status.replace(/_/g, " ")}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {ticket.createdAt?.toDate
                          ? formatDistanceToNow(ticket.createdAt.toDate(), {
                              addSuffix: true,
                            })
                          : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common admin tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/dashboard/users">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
              >
                <Users className="h-5 w-5" />
                <span className="text-xs">Manage Users</span>
              </Button>
            </Link>
            <Link href="/dashboard/applications">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Review Apps</span>
              </Button>
            </Link>
            <Link href="/dashboard/chats">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Open Chats</span>
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button
                variant="outline"
                className="w-full h-auto py-4 flex flex-col items-center gap-2"
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Analytics</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
