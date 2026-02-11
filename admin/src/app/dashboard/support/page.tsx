"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  MoreHorizontal,
  Eye,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  HeadphonesIcon,
  AlertCircle,
  Mail,
} from "lucide-react";
import {
  subscribeToSupportQueries,
  updateSupportStatus,
  addAdminResponse,
} from "@/lib/firestore";
import { SupportQuery, SupportStatus } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

const STATUS_OPTIONS: {
  value: SupportStatus;
  label: string;
  color: string;
  icon: typeof Clock;
}[] = [
  {
    value: "open",
    label: "Open",
    color: "bg-blue-100 text-blue-700",
    icon: AlertCircle,
  },
  {
    value: "in_progress",
    label: "In Progress",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  {
    value: "resolved",
    label: "Resolved",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  {
    value: "closed",
    label: "Closed",
    color: "bg-gray-100 text-gray-700",
    icon: XCircle,
  },
];

function getStatusInfo(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status) || {
      value: status,
      label: status,
      color: "bg-gray-100 text-gray-700",
      icon: Clock,
    }
  );
}

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-blue-50 text-blue-600",
  technical: "bg-purple-50 text-purple-600",
  billing: "bg-green-50 text-green-600",
  feedback: "bg-amber-50 text-amber-600",
};

export default function SupportPage() {
  const [queries, setQueries] = useState<SupportQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportQuery | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeToSupportQueries((data) => {
      setQueries(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const matchesSearch =
        searchQuery === "" ||
        q.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [queries, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: queries.length };
    STATUS_OPTIONS.forEach((s) => {
      counts[s.value] = queries.filter((q) => q.status === s.value).length;
    });
    return counts;
  }, [queries]);

  const handleStatusChange = async (
    ticket: SupportQuery,
    newStatus: SupportStatus
  ) => {
    try {
      await updateSupportStatus(ticket.queryId, newStatus);
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    setActionLoading(true);
    try {
      await addAdminResponse(selectedTicket.queryId, responseText.trim());
      toast.success("Response sent successfully");
      setShowResponseDialog(false);
      setResponseText("");
    } catch (err) {
      toast.error("Failed to send response");
    } finally {
      setActionLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">
          Manage user support queries and feedback
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {STATUS_OPTIONS.map((s) => (
          <Card key={s.value}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-bold">
                    {statusCounts[s.value] || 0}
                  </p>
                </div>
                <s.icon
                  className={`h-5 w-5 ${
                    s.value === "open"
                      ? "text-blue-500"
                      : s.value === "in_progress"
                        ? "text-amber-500"
                        : s.value === "resolved"
                          ? "text-green-500"
                          : "text-gray-400"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject, name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  All Status ({statusCounts.all})
                </SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label} ({statusCounts[s.value] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredQueries.length} Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQueries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">No tickets found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueries.map((ticket) => {
                  const statusInfo = getStatusInfo(ticket.status);
                  return (
                    <TableRow key={ticket.queryId}>
                      <TableCell>
                        <p className="font-medium text-sm">
                          {ticket.subject}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{ticket.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            CATEGORY_COLORS[ticket.category] || ""
                          }
                        >
                          {ticket.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={statusInfo.color}
                        >
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ticket.createdAt?.toDate
                          ? formatDistanceToNow(ticket.createdAt.toDate(), {
                              addSuffix: true,
                            })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowDetail(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setResponseText("");
                                setShowResponseDialog(true);
                              }}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Respond
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {ticket.status !== "resolved" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(ticket, "resolved")
                                }
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark Resolved
                              </DropdownMenuItem>
                            )}
                            {ticket.status !== "closed" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(ticket, "closed")
                                }
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Close Ticket
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              From: {selectedTicket?.name} ({selectedTicket?.email})
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={
                    CATEGORY_COLORS[selectedTicket.category] || ""
                  }
                >
                  {selectedTicket.category}
                </Badge>
                <Badge
                  variant="secondary"
                  className={getStatusInfo(selectedTicket.status).color}
                >
                  {getStatusInfo(selectedTicket.status).label}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {selectedTicket.createdAt?.toDate
                    ? format(selectedTicket.createdAt.toDate(), "PPp")
                    : "—"}
                </span>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Message</p>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-lg">
                  {selectedTicket.message}
                </p>
              </div>

              {selectedTicket.adminResponse && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Admin Response
                  </p>
                  <p className="text-sm whitespace-pre-wrap bg-primary/5 border border-primary/10 p-3 rounded-lg">
                    {selectedTicket.adminResponse}
                  </p>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                <p>User ID: {selectedTicket.uid}</p>
                <p>Ticket ID: {selectedTicket.queryId}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Ticket</DialogTitle>
            <DialogDescription>
              Re: {selectedTicket?.subject}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Your Response</Label>
            <Textarea
              placeholder="Type your response here..."
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendResponse}
              disabled={actionLoading || !responseText.trim()}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
