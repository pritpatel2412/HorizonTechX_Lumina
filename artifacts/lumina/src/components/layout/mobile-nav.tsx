import { Link, useLocation } from "wouter";
import { Home, Compass, Bell, User, Plus, MessageSquare } from "lucide-react";
import { useGetMe, useGetUnreadCount, getGetUnreadCountQueryKey, useGetDmUnreadCount, getGetDmUnreadCountQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CreatePostModal } from "@/components/create-post-modal";

export function MobileNav() {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: unread } = useGetUnreadCount({
    query: { queryKey: getGetUnreadCountQueryKey(), refetchInterval: 60000 }
  });
  const { data: dmUnread } = useGetDmUnreadCount({
    query: { queryKey: getGetDmUnreadCountQueryKey(), refetchInterval: 15000 }
  });

  const leftItems = [
    { name: "Home", href: "/feed", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
  ];

  const rightItems = [
    { name: "Messages", href: "/messages", icon: MessageSquare, badge: dmUnread?.count },
    { name: "Notifications", href: "/notifications", icon: Bell, badge: unread?.count },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-t border-white/5 z-50 px-1 flex items-center justify-around">
        {leftItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 transition-colors rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
              {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}

        {/* Create button */}
        <button
          className="w-12 h-12 rounded-full btn-primary flex items-center justify-center -mt-5 shadow-lg shadow-primary/25"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>

        {rightItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 transition-colors rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
              {!!item.badge && item.badge > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
              {isActive && !item.badge && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })}

        {/* Profile */}
        {(() => {
          const href = `/profile/${user?.username}`;
          const isActive = location.startsWith("/profile/");
          return (
            <Link
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center w-12 h-12 transition-colors rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  className={cn("w-7 h-7 rounded-full object-cover border-2 transition-colors", isActive ? "border-primary" : "border-transparent")}
                  alt=""
                />
              ) : (
                <User className={cn("w-6 h-6", isActive && "fill-primary/20")} />
              )}
              {isActive && !user?.avatarUrl && <div className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
            </Link>
          );
        })()}
      </div>

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
