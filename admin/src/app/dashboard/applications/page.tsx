"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Loader2,
  Download,
  Edit,
  UserPlus,
} from "lucide-react";
import {
  subscribeToApplications,
  updateApplicationStatus,
  assignAgentToApplication,
  fetchAllAgents,
  fetchUserById,
} from "@/lib/firestore";
import { MortgageApplication, ApplicationStatus, Agent, User } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

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
  const [applicantUser, setApplicantUser] = useState<User | null>(null);

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

  const handleViewDetails = async (app: MortgageApplication) => {
    setSelectedApp(app);
    setShowDetail(true);
    // Load applicant user details
    try {
      const user = await fetchUserById(app.userId);
      setApplicantUser(user);
    } catch {
      setApplicantUser(null);
    }
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
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{statusCounts.all}</p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {(statusCounts.submitted || 0) +
                    (statusCounts.pre_approval || 0)}
                </p>
              </div>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {(statusCounts.offer_letter || 0) +
                    (statusCounts.disbursement || 0) +
                    (statusCounts.completed || 0)}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {statusCounts.rejected || 0}
                </p>
              </div>
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
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
                            {app.propertyDetails?.area || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          AED{" "}
                          {app.propertyDetails?.propertyPrice?.toLocaleString() ||
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

      {/* Application Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              ID: {selectedApp?.applicationId}
            </DialogDescription>
          </DialogHeader>
          {selectedApp && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="employment">Employment</TabsTrigger>
                <TabsTrigger value="property">Property</TabsTrigger>
                <TabsTrigger value="financial">Financial</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.applicantIdentity?.fullName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nationality</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.applicantIdentity?.nationality || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date of Birth</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.applicantIdentity?.dateOfBirth || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.applicantIdentity?.gender || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Emirates ID</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.applicantIdentity?.emiratesId || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Passport</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.applicantIdentity?.passportNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.contactResidency?.email || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mobile</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.contactResidency?.mobile || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Address</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.contactResidency?.currentAddress || "N/A"},{" "}
                      {selectedApp.contactResidency?.emirate || ""}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="employment" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employment Type</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.employmentIncome?.employmentType || "N/A"}
                    </p>
                  </div>
                  {selectedApp.employmentIncome?.salariedDetails && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Company</p>
                        <p className="mt-1 font-medium">
                          {selectedApp.employmentIncome.salariedDetails
                            .companyName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Job Title</p>
                        <p className="mt-1 font-medium">
                          {selectedApp.employmentIncome.salariedDetails
                            .jobTitle || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Salary</p>
                        <p className="mt-1 font-medium">
                          AED{" "}
                          {selectedApp.employmentIncome.salariedDetails.totalMonthlySalary?.toLocaleString() ||
                            "0"}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedApp.employmentIncome?.selfEmployedDetails && (
                    <>
                      <div>
                        <p className="text-muted-foreground">Business Name</p>
                        <p className="mt-1 font-medium">
                          {selectedApp.employmentIncome.selfEmployedDetails
                            .businessName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Monthly Income</p>
                        <p className="mt-1 font-medium">
                          AED{" "}
                          {selectedApp.employmentIncome.selfEmployedDetails.monthlyNetIncome?.toLocaleString() ||
                            "0"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="property" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Property Type</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.propertyDetails?.propertyType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Developer</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.propertyDetails?.developer || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Area</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.propertyDetails?.area || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Property Price</p>
                    <p className="mt-1 font-medium">
                      AED{" "}
                      {selectedApp.propertyDetails?.propertyPrice?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.propertyDetails?.propertySize || "N/A"} sqft
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bedrooms</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.propertyDetails?.bedrooms || "N/A"}
                    </p>
                  </div>
                </div>

                <Separator />

                <h4 className="font-medium text-sm">Mortgage Preferences</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Loan Amount</p>
                    <p className="mt-1 font-medium">
                      AED{" "}
                      {selectedApp.mortgagePreferences?.loanAmount?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Down Payment</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.mortgagePreferences?.downPaymentPercent || 0}%
                      (AED{" "}
                      {selectedApp.mortgagePreferences?.downPaymentAmount?.toLocaleString() ||
                        "0"}
                      )
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Loan Tenure</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.mortgagePreferences?.loanTenure || "N/A"}{" "}
                      years
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interest Type</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.mortgagePreferences?.interestType || "N/A"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="financial" className="space-y-4 mt-4">
                <h4 className="font-medium text-sm">Eligibility Results</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Eligible</p>
                    <Badge
                      variant="secondary"
                      className={
                        selectedApp.eligibilityResults?.isEligible
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {selectedApp.eligibilityResults?.isEligible
                        ? "Yes"
                        : "No"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Eligible Loan</p>
                    <p className="mt-1 font-medium">
                      AED{" "}
                      {selectedApp.eligibilityResults?.eligibleLoanAmount?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Estimated EMI</p>
                    <p className="mt-1 font-medium">
                      AED{" "}
                      {selectedApp.eligibilityResults?.estimatedEMI?.toLocaleString() ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">DBR</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.eligibilityResults?.debtBurdenRatio?.toFixed(
                        1
                      ) || "0"}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">LTV Ratio</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.eligibilityResults?.ltvRatio?.toFixed(1) ||
                        "0"}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interest Rate</p>
                    <p className="mt-1 font-medium">
                      {selectedApp.eligibilityResults?.interestRate?.toFixed(
                        2
                      ) || "0"}
                      %
                    </p>
                  </div>
                </div>

                <Separator />

                <h4 className="font-medium text-sm">Financial Obligations</h4>
                <div className="text-sm">
                  <p className="text-muted-foreground">Total Monthly EMI</p>
                  <p className="mt-1 font-medium">
                    AED{" "}
                    {selectedApp.financialObligations?.totalMonthlyEMI?.toLocaleString() ||
                      "0"}
                  </p>
                </div>
                {selectedApp.financialObligations?.existingLoans?.length >
                  0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Existing Loans
                    </p>
                    {selectedApp.financialObligations.existingLoans.map(
                      (loan, i) => (
                        <div
                          key={i}
                          className="p-2 bg-muted rounded text-sm grid grid-cols-3 gap-2"
                        >
                          <div>
                            <span className="text-muted-foreground">Type:</span>{" "}
                            {loan.type}
                          </div>
                          <div>
                            <span className="text-muted-foreground">EMI:</span>{" "}
                            AED {loan.monthlyEMI?.toLocaleString()}
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Balance:
                            </span>{" "}
                            AED {loan.outstandingBalance?.toLocaleString()}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

                {selectedApp.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Admin Notes
                      </p>
                      <p className="mt-1 text-sm bg-muted p-3 rounded">
                        {selectedApp.notes}
                      </p>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                {selectedApp.documentUploads?.documents?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedApp.documentUploads.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.category} &middot;{" "}
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        {doc.downloadURL && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(doc.downloadURL, "_blank")
                            }
                          >
                            <Download className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No documents uploaded
                  </p>
                )}
              </TabsContent>
            </Tabs>
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
