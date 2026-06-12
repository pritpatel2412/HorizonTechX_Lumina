import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetMessages, useSendMessage, useMarkMessagesRead, useGetMe,
  getGetMessagesQueryKey, getGetConversationsQueryKey, getGetDmUnreadCountQueryKey
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send } from "lucide-react";
import { useRoute, useLocation, Link } from "wouter";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";

function formatMessageTime(date: Date) {
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return `Yesterday ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
}

function groupMessagesByDate(messages: any[]) {
  const groups: { label: string; messages: any[] }[] = [];
  let currentLabel = "";
  for (const msg of messages) {
    const d = new Date(msg.createdAt);
    let label = isToday(d) ? "Today" : isYesterday(d) ? "Yesterday" : format(d, "MMMM d, yyyy");
    if (label !== currentLabel) {
      groups.push({ label, messages: [] });
      currentLabel = label;
    }
    groups[groups.length - 1].messages.push(msg);
  }
  return groups;
}

export default function MessageThreadPage() {
  const [, params] = useRoute("/messages/:username");
  const username = params?.username || "";
  const [, navigate] = useLocation();
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: messages, isLoading } = useGetMessages(username, {
    query: {
      queryKey: getGetMessagesQueryKey(username),
      enabled: !!username,
      refetchInterval: 3000,
    }
  });

  const sendMessage = useSendMessage();
  const markRead = useMarkMessagesRead();

  useEffect(() => {
    if (username) {
      markRead.mutate({ username }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDmUnreadCountQueryKey() });
        }
      });
    }
  }, [username]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const otherUser = messages?.find(m => m.senderId !== me?.id)?.sender
    || messages?.find(m => m.senderId === me?.id) ? null : null;

  const firstOtherMessage = messages?.find(m => m.sender.id !== me?.id);
  const peerUser = firstOtherMessage?.sender
    || (messages && messages.length > 0 && messages[0].senderId !== me?.id ? messages[0].sender : null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sendMessage.isPending) return;
    const text = content.trim();
    setContent("");

    sendMessage.mutate({ username, data: { content: text } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(username) });
        queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      },
      onError: () => {
        toast.error("Failed to send message");
        setContent(text);
      }
    });
  };

  const groups = groupMessagesByDate(messages || []);

  return (
    <AppLayout showRightSidebar={false}>
      <div className="flex flex-col h-[calc(100dvh-64px)] md:h-screen w-full max-w-2xl mx-auto">
        {/* Thread header */}
        <div className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 backdrop-blur-xl border-b border-white/5 p-3 sm:p-4 shrink-0">
          <button
            onClick={() => navigate("/messages")}
            className="p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Link href={`/profile/${username}`} className="flex items-center gap-3 flex-1 min-w-0">
            <img
              src={peerUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
              alt={username}
              className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
            />
            <div className="min-w-0">
              <div className="font-semibold text-sm text-white truncate flex items-center gap-1">
                {peerUser?.displayName || username}
                {peerUser?.verified && <span className="text-primary text-[10px]">✦</span>}
              </div>
              <div className="text-xs text-muted-foreground truncate">@{username}</div>
            </div>
          </Link>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto lumina-scrollbar px-3 sm:px-4 py-4 space-y-4 pb-2">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
                  <Skeleton className={cn("rounded-2xl", i % 2 === 0 ? "rounded-tl-sm" : "rounded-tr-sm", "h-10", i % 3 === 0 ? "w-48" : "w-32")} />
                </div>
              ))}
            </div>
          ) : messages && messages.length > 0 ? (
            <>
              {groups.map(group => (
                <div key={group.label}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[11px] text-muted-foreground px-2">{group.label}</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                  <div className="space-y-1.5">
                    {group.messages.map((msg: any, idx: number) => {
                      const isOwn = msg.senderId === me?.id;
                      const nextMsg = group.messages[idx + 1];
                      const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

                      return (
                        <div key={msg.id} className={cn("flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
                          {!isOwn && (
                            <div className="w-7 h-7 shrink-0">
                              {isLastInGroup && (
                                <img
                                  src={msg.sender.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender.username}`}
                                  className="w-7 h-7 rounded-full object-cover"
                                  alt=""
                                />
                              )}
                            </div>
                          )}
                          <div className={cn("max-w-[75%] sm:max-w-[65%]", isOwn ? "items-end" : "items-start", "flex flex-col")}>
                            <div
                              className={cn(
                                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                                isOwn
                                  ? "bg-primary text-white rounded-br-sm"
                                  : "bg-surface-elevated text-foreground rounded-bl-sm border border-white/5"
                              )}
                            >
                              {msg.content}
                            </div>
                            {isLastInGroup && (
                              <span className={cn("text-[10px] text-muted-foreground mt-1 px-1", isOwn ? "text-right" : "text-left")}>
                                {formatMessageTime(new Date(msg.createdAt))}
                                {isOwn && (
                                  <span className="ml-1">{msg.read ? "·· Seen" : "· Sent"}</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                className="w-16 h-16 rounded-full mb-4 border-2 border-primary/30"
                alt=""
              />
              <p className="text-muted-foreground text-sm mb-1">
                Start a conversation with <span className="text-white font-medium">@{username}</span>
              </p>
              <p className="text-muted-foreground text-xs">Messages are private and end-to-end encrypted.</p>
            </div>
          )}
        </div>

        {/* Compose bar */}
        <div className="shrink-0 border-t border-white/5 bg-background/80 backdrop-blur-xl p-3 sm:p-4 pb-safe">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <img
              src={me?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${me?.username}`}
              className="w-8 h-8 rounded-full object-cover shrink-0 hidden sm:block"
              alt=""
            />
            <input
              ref={inputRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); } }}
              placeholder={`Message @${username}...`}
              className="lumina-input flex-1 h-10 px-4 text-sm"
              disabled={sendMessage.isPending}
            />
            <button
              type="submit"
              disabled={!content.trim() || sendMessage.isPending}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0",
                content.trim() ? "bg-primary hover:bg-primary/80 text-white" : "bg-white/5 text-muted-foreground cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
