import { Link, useLocation } from "wouter";
import { useGetMe, useGetUnreadCount, getGetUnreadCountQueryKey } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Home, Compass, Bell, Bookmark, User, Settings, Plus, LogOut } from "lucide-react";
import { removeToken } from "@/lib/auth";
import { useState } from "react";
import { CreatePostModal } from "@/components/create-post-modal";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const { data: unread } = useGetUnreadCount({
    query: { queryKey: getGetUnreadCountQueryKey(), refetchInterval: 60000 }
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/feed", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Notifications", href: "/notifications", icon: Bell, badge: unread?.count },
    { name: "Saved", href: "/saved", icon: Bookmark },
    { name: "Profile", href: `/profile/${user?.username}`, icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const handleLogout = () => {
    removeToken();
    setLocation("/");
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[260px] flex-col bg-background/80 backdrop-blur-xl border-r border-white/5 md:flex">
        <div className="flex items-center gap-3 p-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <div className="h-3 w-3 rounded-full bg-primary" />
          </div>
          <span className="font-display text-xl font-extrabold tracking-wide">LUMINA</span>
        </div>

        <div className="flex-1 overflow-y-auto lumina-scrollbar px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/feed" && location.startsWith(item.href.split(":")[0]));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "text-primary bg-primary/10 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "group-hover:text-foreground")} />
                <span className="flex-1">{item.name}</span>
                {!!item.badge && item.badge > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-4 space-y-4">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Post</span>
          </button>

          {user && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
              <Link href={`/profile/${user.username}`} className="flex items-center gap-3 overflow-hidden">
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover lumina-avatar-ring shrink-0"
                />
                <div className="truncate">
                  <div className="font-medium text-sm text-foreground truncate">{user.displayName}</div>
                  <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0 ml-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
