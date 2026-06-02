import { useGetTrendingTags, useGetUserSuggestions, useToggleFollow, getGetUserSuggestionsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Hash, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export function RightSidebar() {
  const { data: suggestions, isLoading: suggestionsLoading } = useGetUserSuggestions();
  const { data: trendingTags, isLoading: tagsLoading } = useGetTrendingTags();
  const toggleFollow = useToggleFollow();
  const queryClient = useQueryClient();

  const handleFollow = (username: string) => {
    toggleFollow.mutate({ username }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserSuggestionsQueryKey() });
      }
    });
  };

  return (
    <aside className="sticky top-0 h-screen hidden w-[300px] flex-col gap-6 py-6 pr-6 lg:flex overflow-y-auto lumina-scrollbar">

      {/* Suggestions Widget */}
      <div className="lumina-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-secondary" />
          <h3 className="font-display font-semibold text-lg">Who to Follow</h3>
        </div>

        <div className="space-y-4">
          {suggestionsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))
          ) : (
            suggestions?.slice(0, 4).map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-2 group">
                <Link href={`/profile/${user.username}`} className="flex items-center gap-3 overflow-hidden flex-1">
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div className="truncate">
                    <div className="font-medium text-sm text-foreground truncate flex items-center gap-1">
                      {user.displayName}
                      {user.verified && <span className="text-primary text-[10px]">✦</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">@{user.username}</div>
                  </div>
                </Link>
                <Button
                  size="sm"
                  className={cn(
                    "h-7 rounded-full text-xs px-3 shrink-0",
                    user.isFollowing
                      ? "bg-white/10 hover:bg-white/20 text-white border-0"
                      : "bg-primary/20 hover:bg-primary/30 text-primary border-0"
                  )}
                  onClick={() => handleFollow(user.username)}
                  disabled={toggleFollow.isPending}
                >
                  {user.isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Tags Widget */}
      <div className="lumina-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Hash className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-lg">Trending</h3>
        </div>

        <div className="space-y-4">
          {tagsLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          ) : (
            trendingTags?.slice(0, 6).map((tag) => (
              <Link
                key={tag.tag}
                href={`/explore?tag=${encodeURIComponent(tag.tag)}`}
                className="block group"
              >
                <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                  #{tag.tag}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {tag.count.toLocaleString()} posts
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
