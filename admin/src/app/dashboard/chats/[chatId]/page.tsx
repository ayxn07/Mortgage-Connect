"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  subscribeToMessages,
  fetchChatById,
  sendMessage,
  markChatAsRead,
  setTypingStatus,
  setCurrentChat,
  subscribeToPresence,
  deleteMessage,
} from "@/lib/chat-service";
import type { Chat, Message } from "@/lib/types";
import type { UserPresence } from "@/lib/chat-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Send,
  Loader2,
  Circle,
  Check,
  CheckCheck,
  Trash2,
  MoreVertical,
  Phone,
  Mail,
} from "lucide-react";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
} from "@/components/ui/card";

export default function ChatConversationPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.chatId as string;
  const { firebaseUser, userDoc } = useAuth();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherPresence, setOtherPresence] = useState<UserPresence | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load chat details
  useEffect(() => {
    async function loadChat() {
      const c = await fetchChatById(chatId);
      setChat(c);
      setLoading(false);
    }
    loadChat();
  }, [chatId]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, 100, (msgs) => {
      setMessages(msgs.reverse()); // newest last for display
    });
    return () => unsubscribe();
  }, [chatId]);

  // Mark as read + set current chat
  useEffect(() => {
    if (!firebaseUser?.uid || !chatId) return;
    markChatAsRead(chatId, firebaseUser.uid);
    setCurrentChat(firebaseUser.uid, chatId);

    return () => {
      setCurrentChat(firebaseUser.uid, null);
    };
  }, [chatId, firebaseUser?.uid]);

  // Subscribe to other user's presence
  useEffect(() => {
    if (!chat || !firebaseUser) return;
    const otherParticipant = Object.values(chat.participants || {}).find(
      (p) => p.uid !== firebaseUser.uid
    );
    if (!otherParticipant) return;

    const unsubscribe = subscribeToPresence(otherParticipant.uid, (presence) => {
      setOtherPresence(presence);
    });
    return () => unsubscribe();
  }, [chat, firebaseUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when new messages arrive
  useEffect(() => {
    if (!firebaseUser?.uid || messages.length === 0) return;
    markChatAsRead(chatId, firebaseUser.uid);
  }, [messages.length, chatId, firebaseUser?.uid]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!firebaseUser?.uid) return;
    setTypingStatus(firebaseUser.uid, chatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(firebaseUser.uid, null);
    }, 2000);
  }, [firebaseUser?.uid, chatId]);

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() || !firebaseUser || !userDoc || sending) return;

    const text = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      await sendMessage(
        chatId,
        firebaseUser.uid,
        userDoc.displayName || "Admin",
        userDoc.photoURL || null,
        text
      );
      setTypingStatus(firebaseUser.uid, null);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInputText(text); // Restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(chatId, messageId);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  // Get other participant details
  const otherParticipant = chat
    ? Object.values(chat.participants || {}).find(
        (p) => p.uid !== firebaseUser?.uid
      )
    : null;

  // Format message timestamp
  const formatMsgTime = (timestamp: Message["timestamp"]) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    return format(date, "h:mm a");
  };

  // Format date separator
  const formatDateSeparator = (timestamp: Message["timestamp"]) => {
    if (!timestamp?.toDate) return "";
    const date = timestamp.toDate();
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMM d, yyyy");
  };

  // Check if we should show a date separator
  const shouldShowDateSeparator = (
    msg: Message,
    prevMsg: Message | null
  ): boolean => {
    if (!prevMsg) return true;
    if (!msg.timestamp?.toDate || !prevMsg.timestamp?.toDate) return false;
    const current = msg.timestamp.toDate();
    const prev = prevMsg.timestamp.toDate();
    return current.toDateString() !== prev.toDateString();
  };

  // Check read receipt
  const isReadByOther = (msg: Message) => {
    if (!otherParticipant) return false;
    return !!msg.readBy?.[otherParticipant.uid];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold">Chat not found</h2>
        <p className="text-muted-foreground mt-2">
          This conversation may have been deleted.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chats
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/chats")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {otherParticipant?.displayName?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          {otherPresence?.isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold truncate">
              {otherParticipant?.displayName || "Unknown"}
            </h2>
            <Badge variant="outline" className="text-[10px]">
              {otherParticipant?.role || "user"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {otherPresence?.isTypingIn === chatId ? (
              <span className="text-primary font-medium">typing...</span>
            ) : otherPresence?.isOnline ? (
              "Online"
            ) : otherPresence?.lastSeen ? (
              `Last seen ${formatDistanceToNow(otherPresence.lastSeen.toDate(), { addSuffix: true })}`
            ) : (
              "Offline"
            )}
          </p>
        </div>

        <Badge variant="secondary" className="text-[10px]">
          {chat.type.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {messages.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === firebaseUser?.uid;
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showDate = shouldShowDateSeparator(msg, prevMsg);

            return (
              <div key={msg.messageId || idx}>
                {/* Date Separator */}
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-muted text-muted-foreground text-[11px] px-3 py-1 rounded-full">
                      {formatDateSeparator(msg.timestamp)}
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`flex mb-1.5 ${
                    isMine ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`group relative max-w-[75%] ${
                      isMine ? "items-end" : "items-start"
                    }`}
                  >
                    {!isMine && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">
                        {msg.senderName}
                      </p>
                    )}
                    <div
                      className={`relative px-3.5 py-2 rounded-2xl text-sm break-words ${
                        msg.deleted
                          ? "bg-muted/50 text-muted-foreground italic"
                          : isMine
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.deleted ? (
                        <span className="text-xs">This message was deleted</span>
                      ) : (
                        <>
                          {/* Reply indicator */}
                          {msg.replyTo && (
                            <div
                              className={`text-[11px] px-2 py-1 mb-1 rounded border-l-2 ${
                                isMine
                                  ? "bg-primary-foreground/10 border-primary-foreground/30"
                                  : "bg-background/50 border-primary/30"
                              }`}
                            >
                              <p className="font-medium">{msg.replyTo.senderName}</p>
                              <p className="truncate opacity-80">
                                {msg.replyTo.text}
                              </p>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">
                            {msg.content?.text || ""}
                          </p>
                          {msg.content?.mediaUrl && msg.type === "image" && (
                            <img
                              src={msg.content.mediaUrl}
                              alt="shared"
                              className="rounded-lg mt-1 max-w-full"
                            />
                          )}
                          {msg.content?.mediaUrl && msg.type === "document" && (
                            <a
                              href={msg.content.mediaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-xs mt-1 block"
                            >
                              {msg.content.fileName || "Download file"}
                            </a>
                          )}
                        </>
                      )}

                      {/* Time & read receipt */}
                      <div
                        className={`flex items-center gap-1 mt-0.5 ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span
                          className={`text-[10px] ${
                            isMine
                              ? "text-primary-foreground/60"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatMsgTime(msg.timestamp)}
                          {msg.edited && " (edited)"}
                        </span>
                        {isMine && !msg.deleted && (
                          <span
                            className={`text-primary-foreground/60`}
                          >
                            {isReadByOther(msg) ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Message actions (visible on hover) */}
                    {isMine && !msg.deleted && (
                      <div className="absolute top-0 -left-8 hidden group-hover:block">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() =>
                                  handleDeleteMessage(msg.messageId)
                                }
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete message</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="border-t pt-3 pb-2">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={sending}
          />
          <Button
            size="icon"
            disabled={!inputText.trim() || sending}
            onClick={handleSend}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
