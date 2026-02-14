"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeToChats,
  subscribeToAllChats,
 createChat } from "@/lib/chat-service";
import { fetchAllUsers } from "@/lib/firestore";
import type { Chat, User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  MessageCircle,
  Plus,
  Circle,
  Loader2,
  Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ChatsPage() {
  const { firebaseUser, userDoc } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "user_admin" | "agent_admin">("all");

  // New chat dialog
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [initialMsg, setInitialMsg] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!firebaseUser?.uid) return;

    // Subscribe to all chats for admin visibility
    const unsubscribe = subscribeToAllChats((allChats) => {
      setChats(allChats);
      setLoading(false);
    });

    // Load all users for new chat dialog
    fetchAllUsers().then(setUsers).catch(console.error);

    return () => unsubscribe();
  }, [firebaseUser?.uid]);

  const filteredChats = useMemo(() => {
    let result = chats;

    // Filter by type
    if (filter === "unread") {
      result = result.filter(
        (c) => firebaseUser && (c.unreadCount?.[firebaseUser.uid] || 0) > 0
      );
    } else if (filter === "user_admin" || filter === "agent_admin") {
      result = result.filter((c) => c.type === filter);
    }

    // Search by participant name
    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((c) => {
        const participants = Object.values(c.participants || {});
        return participants.some(
          (p) =>
            p.displayName?.toLowerCase().includes(s) ||
            p.role?.toLowerCase().includes(s)
        );
      });
    }

    return result;
  }, [chats, filter, search, firebaseUser]);

  const getOtherParticipant = (chat: Chat) => {
    if (!firebaseUser) return null;
    const participants = Object.values(chat.participants || {});
    return participants.find((p) => p.uid !== firebaseUser.uid) || participants[0];
  };

  const getParticipantNames = (chat: Chat) => {
    const participants = Object.values(chat.participants || {});
    return participants.map((p) => p.displayName).join(", ");
  };

  const handleCreateChat = async () => {
    if (!firebaseUser || !userDoc || !selectedUser) return;
    setCreating(true);
    try {
      const otherUser = users.find((u) => u.uid === selectedUser);
      if (!otherUser) return;

      await createChat(
        firebaseUser.uid,
        userDoc.displayName || "Admin",
        userDoc.photoURL || null,
        "admin",
        otherUser.uid,
        otherUser.displayName || "User",
        otherUser.photoURL || null,
        otherUser.role,
        initialMsg || undefined
      );

      setNewChatOpen(false);
      setSelectedUser("");
      setInitialMsg("");
    } catch (err) {
      console.error("Failed to create chat:", err);
    } finally {
      setCreating(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
          <p className="text-muted-foreground">
            Manage conversations with users and agents
          </p>
        </div>
        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Start New Conversation</DialogTitle>
              <DialogDescription>
                Select a user or agent to start chatting with
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.uid !== firebaseUser?.uid)
                    .map((u) => (
                      <SelectItem key={u.uid} value={u.uid}>
                        <div className="flex items-center gap-2">
                          <span>{u.displayName || u.email}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {u.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Type an initial message (optional)..."
                value={initialMsg}
                onChange={(e) => setInitialMsg(e.target.value)}
                rows={3}
              />
              <Button
                className="w-full"
                disabled={!selectedUser || creating}
                onClick={handleCreateChat}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                Start Chat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by participant name..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Chats</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
            <SelectItem value="user_admin">User-Admin</SelectItem>
            <SelectItem value="agent_admin">Agent-Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{chats.length}</p>
                <p className="text-xs text-muted-foreground">Total Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Circle className="h-5 w-5 text-destructive fill-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {firebaseUser
                    ? chats.filter(
                        (c) => (c.unreadCount?.[firebaseUser.uid] || 0) > 0
                      ).length
                    : 0}
                </p>
                <p className="text-xs text-muted-foreground">Unread Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {chats.filter((c) => c.type === "user_admin").length}
                </p>
                <p className="text-xs text-muted-foreground">User Conversations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat List */}
      {filteredChats.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium">No conversations found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search || filter !== "all"
                ? "Try adjusting your filters"
                : "Start a new chat with a user or agent"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredChats.map((chat) => {
            const other = getOtherParticipant(chat);
            const unread = firebaseUser
              ? chat.unreadCount?.[firebaseUser.uid] || 0
              : 0;
            const lastMsg = chat.lastMessage;

            return (
              <Link key={chat.chatId} href={`/dashboard/chats/${chat.chatId}`}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/20 ${
                    unread > 0 ? "border-primary/30 bg-primary/[0.02]" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {other?.displayName?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-sm truncate ${
                              unread > 0 ? "font-bold" : "font-medium"
                            }`}
                          >
                            {other?.displayName || getParticipantNames(chat)}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] shrink-0"
                          >
                            {other?.role || chat.type.replace(/_/g, "-")}
                          </Badge>
                        </div>
                        {lastMsg && (
                          <p
                            className={`text-xs mt-0.5 truncate ${
                              unread > 0
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {lastMsg.senderId === firebaseUser?.uid
                              ? "You: "
                              : ""}
                            {lastMsg.text || "Media"}
                          </p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <div className="text-right shrink-0">
                        {lastMsg?.timestamp && (
                          <p className="text-[11px] text-muted-foreground">
                            {lastMsg.timestamp?.toDate
                              ? formatDistanceToNow(
                                  lastMsg.timestamp.toDate(),
                                  { addSuffix: true }
                                )
                              : ""}
                          </p>
                        )}
                        <Badge
                          variant="secondary"
                          className="text-[10px] mt-1"
                        >
                          {chat.type.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
