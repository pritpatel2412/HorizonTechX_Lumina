import { AppLayout } from "@/components/layout/app-layout";
import { useGetNotifications, useMarkAllNotificationsRead, useMarkNotificationRead, getGetNotificationsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Heart, MessageCircle, UserPlus, AtSign, CheckCheck, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useGetNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      }
    });
  };

  const handleNotificationClick = (id: number, read: boolean, postId?: number | null) => {
    if (!read) {
      markRead.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
        }
      });
    }
    if (postId) {
      navigate(`/post/${postId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="w-4 h-4 text-secondary fill-secondary" />;
      case "comment": return <MessageCircle className="w-4 h-4 text-primary fill-primary" />;
      case "follow": return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case "mention": return <AtSign className="w-4 h-4 text-primary" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionText = (type: string) => {
    switch (type) {
      case "like": return "liked your post";
      case "comment": return "commented on your post";
      case "follow": return "started following you";
      case "mention": return "mentioned you in a comment";
      default: return "interacted with your content";
    }
  };

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-white"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending || unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        </div>

        <div className="lumina-card overflow-hidden">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-white/5 flex gap-4">
                <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-white/5">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    "p-4 flex gap-4 transition-colors hover:bg-white/5 cursor-pointer relative",
                    !notif.read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notif.id, notif.read, notif.postId)}
                >
                  {!notif.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-sm" />
                  )}

                  <div className="relative shrink-0">
                    <Link
                      href={`/profile/${notif.sender.username}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={notif.sender.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.sender.username}`}
                        className="w-12 h-12 rounded-full object-cover"
                        alt={notif.sender.displayName}
                      />
                    </Link>
                    <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-1 border border-surface-elevated">
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <Link
                        href={`/profile/${notif.sender.username}`}
                        className="font-semibold text-white hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {notif.sender.displayName}
                      </Link>{" "}
                      <span className="text-muted-foreground">{getActionText(notif.type)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                    {notif.postPreview && (
                      <p className="text-xs text-muted-foreground/70 mt-1 italic truncate max-w-xs">
                        "{notif.postPreview}"
                      </p>
                    )}
                  </div>

                  {notif.postId && (
                    <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <Bell className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium text-white mb-1">You're all caught up!</p>
              <p className="text-sm">No new notifications</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
