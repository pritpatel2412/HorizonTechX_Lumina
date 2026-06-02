import { Link, useLocation } from "wouter";
import { Home, Compass, Bell, User, Plus } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [location] = useLocation();
  const { data: user } = useGetMe();

  const navItems = [
    { name: "Home", href: "/feed", icon: Home },
    { name: "Explore", href: "/explore", icon: Compass },
    { name: "Create", href: "#", icon: Plus, isCreate: true },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Profile", href: `/profile/${user?.username}`, icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/90 backdrop-blur-xl border-t border-white/5 z-50 px-4 flex items-center justify-between">
      {navItems.map((item) => {
        const isActive = location === item.href;
        
        if (item.isCreate) {
          return (
            <button 
              key={item.name}
              className="w-12 h-12 rounded-full btn-primary flex items-center justify-center -mt-6 shadow-lg shadow-primary/20"
            >
              <item.icon className="w-6 h-6 text-white" />
            </button>
          );
        }
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
            {isActive && <div className="w-1 h-1 rounded-full bg-primary mt-1" />}
          </Link>
        );
      })}
    </div>
  );
}
