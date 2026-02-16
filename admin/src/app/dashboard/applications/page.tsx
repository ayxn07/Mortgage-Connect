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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Edit,
  UserPlus,
  X,
  User as UserIcon,
  Briefcase,
  Building2,
  DollarSign,
  FolderOpen,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Home,
  TrendingUp,
  Percent,
  AlertCircle,
  StickyNote,
} from "lucide-react";
import {
  subscribeToApplications,
  updateApplicationStatus,
  assignAgentToApplication,
  fetchAllAgents,
} from "@/lib/firestore";
import { DocumentViewer } from "@/components/document-viewer";
import { MortgageApplication, ApplicationStatus, Agent } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme-context";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: {
  value: ApplicationStatus;
  label: string;
  color: string;
}[] = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-700" },
  { value: "submitted", label: "Submitted", color: "bg-blue-100 text-blue-700" },
  {
    value: "pre_approval",
    label: "Pre-Approval",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "property_valuation",
    label: "Property Valuation",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "bank_approval",
    label: "Bank Approval",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    value: "offer_letter",
    label: "Offer Letter",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    value: "disbursement",
    label: "Disbursement",
    color: "bg-green-100 text-green-700",
  },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-700" },
  {
    value: "completed",
    label: "Completed",
    color: "bg-green-100 text-green-700",
  },
];

function getStatusInfo(status: string) {
  return (
    STATUS_OPTIONS.find((s) => s.value === status) || {
      value: status,
      label: status,
      color: "bg-gray-100 text-gray-700",
    }
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<MortgageApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<MortgageApplication | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>("submitted");
  const [adminNotes, setAdminNotes] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { themeColor } = useTheme();

  useEffect(() => {
    const unsub = subscribeToApplications((apps) => {
      setApplications(apps);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        searchQuery === "" ||
        app.applicantIdentity?.fullName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        app.applicationId
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, searchQuery, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: applications.length };
    STATUS_OPTIONS.forEach((s) => {
      counts[s.value] = applications.filter(
        (a) => a.status === s.value
      ).length;
    });
    return counts;
  }, [applications]);

  const handleViewDetails = (app: MortgageApplication) => {
    setSelectedApp(app);
    setShowDetail(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await updateApplicationStatus(
        selectedApp.applicationId,
        newStatus,
        adminNotes || undefined
      );
      toast.success(`Application status updated to ${newStatus}`);
      setShowStatusDialog(false);
      setAdminNotes("");
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignAgent = async () => {
    if (!selectedApp || !selectedAgentId) return;
    setActionLoading(true);
    try {
      await assignAgentToApplication(
        selectedApp.applicationId,
        selectedAgentId
      );
      toast.success("Agent assigned successfully");
      setShowAssignDialog(false);
    } catch (err) {
      toast.error("Failed to assign agent");
    } finally {
      setActionLoading(false);
    }
  };

  const openAssignDialog = async (app: MortgageApplication) => {
    setSelectedApp(app);
    setSelectedAgentId(app.agentId || "");
    setShowAssignDialog(true);
    if (agents.length === 0) {
      try {
        const data = await fetchAllAgents();
        setAgents(data);
      } catch (err) {
        console.error("Failed to load agents:", err);
      }
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
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-muted-foreground">
          Manage all mortgage applications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{statusCounts.all}</p>
              </div>
              <FileText className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-muted-foreground' : 'text-primary'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {(statusCounts.submitted || 0) +
                    (statusCounts.pre_approval || 0)}
                </p>
              </div>
              <Clock className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-amber-500' : 'text-primary'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {(statusCounts.offer_letter || 0) +
                    (statusCounts.disbursement || 0) +
                    (statusCounts.completed || 0)}
                </p>
              </div>
              <CheckCircle2 className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-green-500' : 'text-primary'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {statusCounts.rejected || 0}
                </p>
              </div>
              <XCircle className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-red-500' : 'text-primary'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by applicant name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
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

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredApps.length} Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No applications found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApps.map((app) => {
                  const statusInfo = getStatusInfo(app.status);
                  return (
                    <TableRow key={app.applicationId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {app.applicantIdentity?.fullName || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {app.applicationId?.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {app.propertyDetails?.propertyType || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app.propertyDetails?.locationArea || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          AED{" "}
                          {app.propertyDetails?.purchasePrice?.toLocaleString() ||
                            "0"}
                        </p>
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
                        {app.createdAt?.toDate
                          ? formatDistanceToNow(app.createdAt.toDate(), {
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
                              onClick={() => handleViewDetails(app)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedApp(app);
                                setNewStatus(app.status);
                                setAdminNotes(app.notes || "");
                                setShowStatusDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openAssignDialog(app)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Assign Agent
                            </DropdownMenuItem>
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

      {/* Application Detail - Full Screen Overlay */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent
          showCloseButton={false}
          className="!w-[95vw] !max-w-[1800px] !h-[90vh] p-0 overflow-hidden rounded-2xl gap-0 flex flex-col"
        >
          {/* Sticky Header */}
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {selectedApp?.applicantIdentity?.fullName || "Application Details"}
                </DialogTitle>
                <DialogDescription className="text-xs font-mono text-muted-foreground">
                  ID: {selectedApp?.applicationId}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedApp && (
                <Badge variant="secondary" className={cn("text-sm px-3 py-1", getStatusInfo(selectedApp.status).color)}>
                  {getStatusInfo(selectedApp.status).label}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setShowDetail(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          {selectedApp && (
            <DetailTabs app={selectedApp} />
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              {selectedApp?.applicantIdentity?.fullName} &middot;{" "}
              {selectedApp?.applicationId?.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(v) =>
                  setNewStatus(v as ApplicationStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admin Notes (optional)</Label>
              <Textarea
                placeholder="Add notes about this status change..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Agent Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Agent</DialogTitle>
            <DialogDescription>
              Select an agent to handle this application
            </DialogDescription>
          </DialogHeader>
          <Select
            value={selectedAgentId}
            onValueChange={setSelectedAgentId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.uid} value={agent.uid}>
                  {agent.displayName} - {agent.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAssignDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignAgent}
              disabled={actionLoading || !selectedAgentId}
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   Detail Tabs - a dedicated component for the application detail view
   ================================================================ */

const DETAIL_TABS = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "property", label: "Property", icon: Building2 },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "documents", label: "Documents", icon: FolderOpen },
] as const;

type TabId = (typeof DETAIL_TABS)[number]["id"];

function DetailTabs({ app }: { app: MortgageApplication }) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  return (
    <div className="flex flex-1 min-h-0">
      {/* Side Navigation - Fixed at top, full height */}
      <div className="w-52 border-r bg-muted/20 flex-shrink-0 overflow-y-auto">
        <nav className="flex flex-col gap-1 p-3">
          {DETAIL_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "personal" && <PersonalTab app={app} />}
        {activeTab === "employment" && <EmploymentTab app={app} />}
        {activeTab === "property" && <PropertyTab app={app} />}
        {activeTab === "financial" && <FinancialTab app={app} />}
        {activeTab === "documents" && (
          <DocumentViewer
            documents={app.documentUploads?.documents || []}
            applicantName={app.applicantIdentity?.fullName || "Applicant"}
          />
        )}
      </div>
    </div>
  );
}

/* ---- Reusable info field ---- */

function InfoField({
  icon: Icon,
  label,
  value,
  mono,
  full,
}: {
  icon?: typeof UserIcon;
  label: string;
  value: string | number | undefined | null;
  mono?: boolean;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1", full && "col-span-2 md:col-span-3")}>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className={cn("text-sm font-medium", mono && "font-mono")}>
        {value || "N/A"}
      </p>
    </div>
  );
}

/* ---- Section wrapper ---- */

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof UserIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ---- Tab content: Personal ---- */

function PersonalTab({ app }: { app: MortgageApplication }) {
  return (
    <div className="space-y-8">
      <DetailSection title="Identity Information" icon={UserIcon}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 rounded-xl border bg-card p-5">
          <InfoField icon={UserIcon} label="Full Name" value={app.applicantIdentity?.fullName} />
          <InfoField label="Nationality" value={app.applicantIdentity?.nationality} />
          <InfoField icon={Calendar} label="Date of Birth" value={app.applicantIdentity?.dateOfBirth} />
          <InfoField label="Gender" value={app.applicantIdentity?.gender} />
          <InfoField label="Marital Status" value={app.applicantIdentity?.maritalStatus} />
          <InfoField label="Number of Dependents" value={app.applicantIdentity?.numberOfDependents} />
          <InfoField icon={CreditCard} label="Emirates ID" value={app.applicantIdentity?.emiratesIdNumber} mono />
          <InfoField label="Emirates ID Expiry" value={app.applicantIdentity?.emiratesIdExpiry} mono />
          <InfoField label="Passport No." value={app.applicantIdentity?.passportNumber} mono />
          <InfoField label="Passport Expiry" value={app.applicantIdentity?.passportExpiry} mono />
        </div>
      </DetailSection>

      <DetailSection title="Contact & Residency" icon={Phone}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 rounded-xl border bg-card p-5">
          <InfoField icon={Mail} label="Email" value={app.contactResidency?.email} />
          <InfoField icon={Phone} label="Mobile" value={app.contactResidency?.mobileNumber} />
          <InfoField label="Emirate" value={app.contactResidency?.emirate} />
          <InfoField label="Residential Status" value={app.contactResidency?.residentialStatus} />
          <InfoField label="Years in UAE" value={app.contactResidency?.yearsInUAE} />
          <InfoField icon={MapPin} label="Address" value={app.contactResidency?.currentAddress} full />
        </div>
      </DetailSection>
    </div>
  );
}

/* ---- Tab content: Employment ---- */

function EmploymentTab({ app }: { app: MortgageApplication }) {
  const emp = app.employmentIncome;
  return (
    <div className="space-y-8">
      <DetailSection title="Employment Details" icon={Briefcase}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 rounded-xl border bg-card p-5">
          <InfoField icon={Briefcase} label="Employment Type" value={emp?.employmentType} />
          {emp?.salaried && (
            <>
              <InfoField icon={Building2} label="Employer Name" value={emp.salaried.employerName} />
              <InfoField label="Employer Industry" value={emp.salaried.employerIndustry} />
              <InfoField label="Job Title" value={emp.salaried.jobTitle} />
              <InfoField
                icon={DollarSign}
                label="Monthly Gross Salary"
                value={emp.salaried.monthlyGrossSalary ? `AED ${emp.salaried.monthlyGrossSalary.toLocaleString()}` : undefined}
              />
              <InfoField
                label="Monthly Net Salary"
                value={emp.salaried.monthlyNetSalary ? `AED ${emp.salaried.monthlyNetSalary.toLocaleString()}` : undefined}
              />
              <InfoField label="Length of Service" value={emp.salaried.lengthOfServiceMonths ? `${emp.salaried.lengthOfServiceMonths} months` : undefined} />
              <InfoField label="Employment Type" value={emp.salaried.salariedEmploymentType} />
              <InfoField label="Salary Transfer Bank" value={emp.salaried.salaryTransferBank} />
            </>
          )}
          {emp?.selfEmployed && (
            <>
              <InfoField icon={Building2} label="Company Name" value={emp.selfEmployed.companyName} />
              <InfoField label="Trade License No." value={emp.selfEmployed.tradeLicenseNumber} mono />
              <InfoField label="Company Age" value={emp.selfEmployed.companyAgeYears ? `${emp.selfEmployed.companyAgeYears} years` : undefined} />
              <InfoField
                icon={DollarSign}
                label="Monthly Average Income"
                value={emp.selfEmployed.monthlyAverageIncome ? `AED ${emp.selfEmployed.monthlyAverageIncome.toLocaleString()}` : undefined}
              />
              <InfoField label="Office Location" value={emp.selfEmployed.officeLocation} />
              <InfoField label="Ownership %" value={emp.selfEmployed.ownershipPercentage ? `${emp.selfEmployed.ownershipPercentage}%` : undefined} />
            </>
          )}
        </div>
      </DetailSection>
    </div>
  );
}

/* ---- Tab content: Property ---- */

function PropertyTab({ app }: { app: MortgageApplication }) {
  return (
    <div className="space-y-8">
      <DetailSection title="Property Details" icon={Home}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 rounded-xl border bg-card p-5">
          <InfoField icon={Home} label="Property Type" value={app.propertyDetails?.propertyType} />
          <InfoField label="Property Identified" value={app.propertyDetails?.propertyIdentified ? "Yes" : "No"} />
          <InfoField label="Property Status" value={app.propertyDetails?.propertyStatus} />
          <InfoField icon={Building2} label="Developer" value={app.propertyDetails?.developerName} />
          <InfoField label="Project Name" value={app.propertyDetails?.projectName} />
          <InfoField icon={MapPin} label="Area" value={app.propertyDetails?.locationArea} />
          <InfoField
            icon={DollarSign}
            label="Purchase Price"
            value={app.propertyDetails?.purchasePrice ? `AED ${app.propertyDetails.purchasePrice.toLocaleString()}` : undefined}
          />
          <InfoField label="Size" value={app.propertyDetails?.unitSizeSqft ? `${app.propertyDetails.unitSizeSqft} sqft` : undefined} />
          <InfoField label="Bedrooms" value={app.propertyDetails?.numberOfBedrooms} />
          <InfoField label="Parking Included" value={app.propertyDetails?.parkingIncluded ? "Yes" : "No"} />
          <InfoField label="Expected Completion" value={app.propertyDetails?.expectedCompletionDate} />
        </div>
      </DetailSection>

      <DetailSection title="Mortgage Preferences" icon={Percent}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5 rounded-xl border bg-card p-5">
          <InfoField
            icon={DollarSign}
            label="Property Value"
            value={app.mortgagePreferences?.propertyValue ? `AED ${app.mortgagePreferences.propertyValue.toLocaleString()}` : undefined}
          />
          <InfoField
            icon={DollarSign}
            label="Preferred Loan Amount"
            value={app.mortgagePreferences?.preferredLoanAmount ? `AED ${app.mortgagePreferences.preferredLoanAmount.toLocaleString()}` : undefined}
          />
          <InfoField
            label="Down Payment"
            value={
              app.mortgagePreferences?.downPaymentPercent != null
                ? `${app.mortgagePreferences.downPaymentPercent}% (AED ${app.mortgagePreferences?.downPaymentAmount?.toLocaleString() || "0"})`
                : undefined
            }
          />
          <InfoField label="Loan Tenure" value={app.mortgagePreferences?.loanTenureYears ? `${app.mortgagePreferences.loanTenureYears} years` : undefined} />
          <InfoField label="Interest Type" value={app.mortgagePreferences?.interestType} />
          <InfoField label="First Time Buyer" value={app.mortgagePreferences?.isFirstTimeBuyer ? "Yes" : "No"} />
        </div>
      </DetailSection>
    </div>
  );
}

/* ---- Tab content: Financial ---- */

function FinancialTab({ app }: { app: MortgageApplication }) {
  const elig = app.eligibilityResults;
  const fin = app.financialObligations;

  return (
    <div className="space-y-8">
      <DetailSection title="Eligibility Results" icon={CheckCircle2}>
        <div className="rounded-xl border bg-card p-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
            <InfoField
              icon={DollarSign}
              label="Eligible Loan Amount"
              value={elig?.eligibleLoanAmount ? `AED ${elig.eligibleLoanAmount.toLocaleString()}` : undefined}
            />
            <InfoField
              label="Estimated EMI"
              value={elig?.estimatedEMI ? `AED ${elig.estimatedEMI.toLocaleString()}` : undefined}
            />
            <InfoField
              icon={Percent}
              label="Interest Rate Range"
              value={elig?.approxRateMin != null && elig?.approxRateMax != null 
                ? `${elig.approxRateMin.toFixed(2)}% - ${elig.approxRateMax.toFixed(2)}%` 
                : undefined}
            />
            <InfoField
              label="Debt Burden Ratio (DBR)"
              value={elig?.dbrPercent != null ? `${elig.dbrPercent.toFixed(1)}%` : undefined}
            />
            <InfoField
              label="LTV Ratio"
              value={elig?.ltvPercent != null ? `${elig.ltvPercent.toFixed(1)}%` : undefined}
            />
            <InfoField
              label="Eligible Banks"
              value={elig?.eligibleBanksCount != null ? `${elig.eligibleBanksCount} banks` : undefined}
            />
            {elig?.additionalDownPaymentRequired > 0 && (
              <InfoField
                icon={DollarSign}
                label="Additional Down Payment Required"
                value={`AED ${elig.additionalDownPaymentRequired.toLocaleString()}`}
              />
            )}
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Financial Obligations" icon={CreditCard}>
        <div className="rounded-xl border bg-card p-5 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
            <InfoField
              icon={DollarSign}
              label="Total Monthly EMI"
              value={fin?.totalMonthlyEMI ? `AED ${fin.totalMonthlyEMI.toLocaleString()}` : "AED 0"}
            />
            <InfoField
              label="Has Existing Loans"
              value={fin?.hasExistingLoans ? "Yes" : "No"}
            />
            <InfoField
              label="Credit Cards"
              value={fin?.creditCardsCount != null ? `${fin.creditCardsCount} cards` : undefined}
            />
            <InfoField
              icon={DollarSign}
              label="Total Credit Card Limit"
              value={fin?.totalCreditCardLimit ? `AED ${fin.totalCreditCardLimit.toLocaleString()}` : undefined}
            />
          </div>

          {fin?.loans?.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Existing Loans</p>
              <div className="space-y-2">
                {fin.loans.map((loan, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-2 gap-4 rounded-lg bg-muted/40 border px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">{loan.label || loan.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly EMI</p>
                      <p className="font-medium">AED {loan.emiAmount?.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DetailSection>

      {app.notes && (
        <DetailSection title="Admin Notes" icon={StickyNote}>
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{app.notes}</p>
          </div>
        </DetailSection>
      )}
    </div>
  );
}
