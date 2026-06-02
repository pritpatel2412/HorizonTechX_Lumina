import { Link, useLocation } from "wouter";
import { Home, Compass, Bell, User, Plus } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { CreatePostModal } from "@/components/create-post-modal";

export function MobileNav() {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/feed", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Profile", href: `/profile/${user?.username}`, icon: User },
  ];

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-xl border-t border-white/5 z-50 px-2 flex items-center justify-around">
        {navItems.slice(0, 2).map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 transition-colors rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
              {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-1" />}
            </Link>
          );
        })}

        {/* Create button */}
        <button
          className="w-12 h-12 rounded-full btn-primary flex items-center justify-center -mt-6 shadow-lg shadow-primary/20"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-6 h-6 text-white" />
        </button>

        {navItems.slice(2).map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-12 h-12 transition-colors rounded-xl",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
              {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-1" />}
            </Link>
          );
        })}
      </div>

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
