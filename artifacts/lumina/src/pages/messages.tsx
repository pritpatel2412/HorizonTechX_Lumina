import { AppLayout } from "@/components/layout/app-layout";
import { useGetConversations, getGetConversationsQueryKey, useGetDmUnreadCount, getGetDmUnreadCountQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";

export default function MessagesPage() {
  const { data: conversations, isLoading } = useGetConversations({
    query: { queryKey: getGetConversationsQueryKey(), refetchInterval: 5000 }
  });
  const { data: me } = useGetMe();
  const [search, setSearch] = useState("");

  const filtered = conversations?.filter(c =>
    c.user.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.user.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout showRightSidebar={false}>
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-white/5 p-4 sm:p-6">
          <h1 className="font-display text-2xl font-bold text-white mb-4">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="lumina-input w-full h-10 pl-10 pr-4 text-sm"
            />
          </div>
        </div>

        <div className="pb-20">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border-b border-white/5">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))
          ) : filtered && filtered.length > 0 ? (
            filtered.map(conv => {
              const isFromMe = conv.lastMessage.senderId === me?.id;
              return (
                <Link
                  key={conv.user.id}
                  href={`/messages/${conv.user.username}`}
                  className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors border-b border-white/5 group"
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user.username}`}
                      alt={conv.user.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-white/10 group-hover:border-primary/40 transition-colors"
                    />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("font-medium text-sm truncate flex items-center gap-1", conv.unreadCount > 0 ? "text-white" : "text-foreground")}>
                        {conv.user.displayName}
                        {conv.user.verified && <span className="text-primary text-[9px]">✦</span>}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                      </span>
                    </div>
                    <p className={cn("text-sm truncate", conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {isFromMe ? "You: " : ""}{conv.lastMessage.content}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">
                {search ? "No conversations found" : "No messages yet"}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs">
                {search ? `No conversations match "${search}"` : "Visit someone's profile and send them a message to get started."}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
