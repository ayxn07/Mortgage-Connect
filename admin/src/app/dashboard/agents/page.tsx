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
  Star,
  MapPin,
  Clock,
  ToggleLeft,
  ToggleRight,
  Loader2,
  UserCheck,
  TrendingUp,
  MessageSquare,
  Award,
} from "lucide-react";
import {
  fetchAllAgents,
  toggleAgentAvailability,
  toggleAgentFeatured,
  fetchAgentReviews,
} from "@/lib/firestore";
import { Agent, Review } from "@/lib/types";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme-context";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showFeaturedDialog, setShowFeaturedDialog] = useState(false);
  const [selectedFeatured, setSelectedFeatured] = useState<Set<string>>(new Set());
  const [savingFeatured, setSavingFeatured] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const { themeColor } = useTheme();

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      const data = await fetchAllAgents();
      setAgents(data);
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setLoading(false);
    }
  }

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agents;
    const q = searchQuery.toLowerCase();
    return agents.filter(
      (a) =>
        a.displayName?.toLowerCase().includes(q) ||
        a.location?.toLowerCase().includes(q) ||
        a.specialty?.some((s) => s.toLowerCase().includes(q))
    );
  }, [agents, searchQuery]);

  const handleToggleAvailability = async (agent: Agent) => {
    try {
      await toggleAgentAvailability(agent.uid, !agent.availability);
      setAgents((prev) =>
        prev.map((a) =>
          a.uid === agent.uid
            ? { ...a, availability: !agent.availability }
            : a
        )
      );
      toast.success(
        `${agent.displayName} is now ${!agent.availability ? "available" : "unavailable"}`
      );
    } catch (err) {
      toast.error("Failed to update availability");
    }
  };

  const handleToggleFeatured = async (agent: Agent) => {
    try {
      await toggleAgentFeatured(agent.uid, !agent.isFeatured);
      setAgents((prev) =>
        prev.map((a) =>
          a.uid === agent.uid
            ? { ...a, isFeatured: !agent.isFeatured }
            : a
        )
      );
      toast.success(
        `${agent.displayName} is now ${!agent.isFeatured ? "featured" : "not featured"}`
      );
    } catch (err) {
      toast.error("Failed to update featured status");
    }
  };

  const handleOpenFeaturedDialog = () => {
    const currentFeatured = new Set(
      agents.filter((a) => a.isFeatured).map((a) => a.uid)
    );
    setSelectedFeatured(currentFeatured);
    setShowFeaturedDialog(true);
  };

  const handleToggleFeaturedSelection = (uid: string) => {
    setSelectedFeatured((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(uid)) {
        newSet.delete(uid);
      } else {
        newSet.add(uid);
      }
      return newSet;
    });
  };

  const handleSaveFeatured = async () => {
    setSavingFeatured(true);
    try {
      const updates = agents.map(async (agent) => {
        const shouldBeFeatured = selectedFeatured.has(agent.uid);
        if (agent.isFeatured !== shouldBeFeatured) {
          await toggleAgentFeatured(agent.uid, shouldBeFeatured);
        }
      });
      await Promise.all(updates);
      
      setAgents((prev) =>
        prev.map((a) => ({
          ...a,
          isFeatured: selectedFeatured.has(a.uid),
        }))
      );
      
      toast.success("Featured agents updated successfully");
      setShowFeaturedDialog(false);
    } catch (err) {
      toast.error("Failed to update featured agents");
    } finally {
      setSavingFeatured(false);
    }
  };

  const handleViewDetails = async (agent: Agent) => {
    setSelectedAgent(agent);
    setShowDetail(true);
    setReviewsLoading(true);
    try {
      const r = await fetchAgentReviews(agent.uid);
      setReviews(r);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const avgRating = useMemo(() => {
    if (agents.length === 0) return 0;
    return (
      agents.reduce((sum, a) => sum + (a.avgRating || 0), 0) / agents.length
    ).toFixed(1);
  }, [agents]);

  const totalProjects = useMemo(() => {
    return agents.reduce((sum, a) => sum + (a.completedProjects || 0), 0);
  }, [agents]);

  const featuredCount = useMemo(() => {
    return agents.filter((a) => a.isFeatured).length;
  }, [agents]);

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
        <h1 className="text-2xl font-bold tracking-tight">Agents</h1>
        <p className="text-muted-foreground">
          Manage mortgage agents and their profiles
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold">{agents.length}</p>
              </div>
              <UserCheck className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-muted-foreground' : 'text-primary'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Featured</p>
                <p className="text-2xl font-bold">{featuredCount}</p>
              </div>
              <Award className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-amber-500' : 'text-primary'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold">
                  {agents.filter((a) => a.availability).length}
                </p>
              </div>
              <ToggleRight className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-green-500' : 'text-primary'}`} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold">{avgRating}</p>
              </div>
              <Star className={`h-5 w-5 ${themeColor === 'adaptive' ? 'text-amber-500' : 'text-primary'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Actions */}
      <Card>
        <CardContent className="pt-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={handleOpenFeaturedDialog}>
              <Award className="h-4 w-4 mr-2" />
              Update Featured
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredAgents.length} Agents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No agents found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${themeColor === 'adaptive' ? 'bg-blue-100' : 'bg-primary/10'}`}>
                          <span className={`text-xs font-medium ${themeColor === 'adaptive' ? 'text-blue-700' : 'text-primary'}`}>
                            {agent.displayName?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{agent.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            {agent.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {agent.specialty?.slice(0, 2).map((s) => (
                          <Badge key={s} variant="outline" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                        {(agent.specialty?.length || 0) > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.specialty.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium">
                          {agent.avgRating?.toFixed(1) || "0.0"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({agent.reviewCount || 0})
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {agent.location || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {agent.experience || 0} yrs
                    </TableCell>
                    <TableCell>
                      {agent.isFeatured && (
                        <Badge
                          variant="secondary"
                          className={
                            themeColor === 'adaptive'
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                          }
                        >
                          <Award className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          agent.availability
                            ? themeColor === 'adaptive'
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }
                      >
                        {agent.availability ? "Available" : "Unavailable"}
                      </Badge>
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
                            onClick={() => handleViewDetails(agent)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleFeatured(agent)}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            {agent.isFeatured ? "Remove Featured" : "Mark as Featured"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleAvailability(agent)}
                          >
                            {agent.availability ? (
                              <>
                                <ToggleLeft className="h-4 w-4 mr-2" />
                                Mark Unavailable
                              </>
                            ) : (
                              <>
                                <ToggleRight className="h-4 w-4 mr-2" />
                                Mark Available
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Agent Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agent Details</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-6">
              {/* Agent Profile */}
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${themeColor === 'adaptive' ? 'bg-blue-100' : 'bg-primary/10'}`}>
                  <span className={`text-xl font-bold ${themeColor === 'adaptive' ? 'text-blue-700' : 'text-primary'}`}>
                    {selectedAgent.displayName?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {selectedAgent.displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedAgent.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={
                        selectedAgent.availability
                          ? themeColor === 'adaptive'
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }
                    >
                      {selectedAgent.availability ? "Available" : "Unavailable"}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">
                        {selectedAgent.avgRating?.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="mt-1 font-medium">
                    {selectedAgent.location || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Experience</p>
                  <p className="mt-1 font-medium">
                    {selectedAgent.experience} years
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hourly Rate</p>
                  <p className="mt-1 font-medium">
                    AED {selectedAgent.hourlyRate}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Response Time</p>
                  <p className="mt-1 font-medium">
                    {selectedAgent.responseTime}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Completed Projects</p>
                  <p className="mt-1 font-medium">
                    {selectedAgent.completedProjects}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="mt-1 font-medium">
                    {selectedAgent.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">WhatsApp</p>
                  <p className="mt-1 font-medium">
                    {selectedAgent.whatsapp || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Languages</p>
                  <p className="mt-1 font-medium">
                    {selectedAgent.languages?.join(", ") || "N/A"}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Bio */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Bio</p>
                <p className="text-sm">{selectedAgent.bio || "No bio set"}</p>
              </div>

              {/* Specialties */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Specialties
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.specialty?.map((s) => (
                    <Badge key={s} variant="outline">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Services */}
              {selectedAgent.services?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Services
                  </p>
                  <div className="space-y-2">
                    {selectedAgent.services.map((service, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                      >
                        <span>{service.name}</span>
                        <span className="text-muted-foreground">
                          AED {service.price} &middot; {service.duration}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Reviews */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Reviews ({selectedAgent.reviewCount || 0})
                </p>
                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No reviews yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div
                        key={review.reviewId}
                        className="p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {review.userName}
                          </span>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < review.rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.comment}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {review.createdAt?.toDate
                            ? formatDistanceToNow(review.createdAt.toDate(), {
                                addSuffix: true,
                              })
                            : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Featured Agents Dialog */}
      <Dialog open={showFeaturedDialog} onOpenChange={setShowFeaturedDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Featured Agents</DialogTitle>
            <DialogDescription>
              Select agents to feature on the home screen. Featured agents will be shown to users first.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {selectedFeatured.size} agent{selectedFeatured.size !== 1 ? 's' : ''} selected
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {agents.map((agent) => {
                const isSelected = selectedFeatured.has(agent.uid);
                return (
                  <div
                    key={agent.uid}
                    onClick={() => handleToggleFeaturedSelection(agent.uid)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? themeColor === 'adaptive'
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {isSelected && (
                      <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                        themeColor === 'adaptive' ? 'bg-blue-500' : 'bg-primary'
                      }`}>
                        <Award className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        themeColor === 'adaptive' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-primary/10'
                      }`}>
                        <span className={`text-xl font-bold ${
                          themeColor === 'adaptive' ? 'text-blue-700 dark:text-blue-300' : 'text-primary'
                        }`}>
                          {agent.displayName?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{agent.displayName}</p>
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs text-muted-foreground">
                            {agent.avgRating?.toFixed(1) || "0.0"} ({agent.reviewCount || 0})
                          </span>
                        </div>
                      </div>
                      
                      {agent.specialty && agent.specialty.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {agent.specialty[0]}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFeaturedDialog(false)}
              disabled={savingFeatured}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFeatured} disabled={savingFeatured}>
              {savingFeatured ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Award className="h-4 w-4 mr-2" />
                  Save Featured Agents
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
