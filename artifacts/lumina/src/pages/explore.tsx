import { AppLayout } from "@/components/layout/app-layout";
import { useGetExplorePosts, useSearchUsers, useGetUserSuggestions, useGetTrendingTags } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Hash } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToggleFollow } from "@workspace/api-client-react";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const tagParam = searchParams.get("tag");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(
    { q: debouncedQuery }, 
    { query: { enabled: debouncedQuery.length > 0 } }
  );

  const { data: explorePosts, isLoading: postsLoading } = useGetExplorePosts({ 
    offset: 0, 
    limit: 20,
    tag: tagParam 
  });
  
  const { data: suggestions, isLoading: suggestionsLoading } = useGetUserSuggestions();
  const toggleFollow = useToggleFollow();

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-8">
        
        {/* Search Bar */}
        <div className="relative z-20">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="lumina-input h-14 pl-12 text-lg rounded-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Search Dropdown */}
          {debouncedQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map(user => (
                  <Link key={user.id} href={`/profile/${user.username}`} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
                    <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-medium text-foreground flex items-center gap-1">
                        {user.displayName} {user.verified && <span className="text-primary text-[10px]">✦</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">No users found</div>
              )}
            </div>
          )}
        </div>

        {/* Tag header if filtering by tag */}
        {tagParam && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 p-4 rounded-xl text-primary">
            <Hash className="w-6 h-6" />
            <h1 className="font-display text-2xl font-bold">{tagParam}</h1>
            <Link href="/explore" className="ml-auto text-sm bg-background/50 px-3 py-1 rounded-full hover:bg-background/80">Clear</Link>
          </div>
        )}

        {/* Rising Creators (Horizontal Scroll) */}
        {!tagParam && (
          <div>
            <h2 className="font-display font-bold text-xl mb-4 text-white">Rising Creators</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 lumina-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {suggestionsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="w-[150px] h-[200px] rounded-xl shrink-0" />
                ))
              ) : (
                suggestions?.map(user => (
                  <div key={user.id} className="lumina-card p-4 flex flex-col items-center text-center w-[150px] shrink-0 gap-3">
                    <Link href={`/profile/${user.username}`}>
                      <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-16 h-16 rounded-full mx-auto lumina-avatar-ring mb-2" />
                      <div className="font-medium text-sm text-foreground truncate w-full flex items-center justify-center gap-1">
                        {user.displayName} {user.verified && <span className="text-primary text-[8px]">✦</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate w-full">@{user.username}</div>
                    </Link>
                    <Button 
                      size="sm" 
                      className={cn("w-full mt-auto h-8 text-xs", user.isFollowing ? "bg-white/10 text-white" : "btn-primary")}
                      onClick={() => toggleFollow.mutate({ username: user.username })}
                    >
                      {user.isFollowing ? "Following" : "Follow"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Trending Posts */}
        <div>
          <h2 className="font-display font-bold text-xl mb-4 text-white">{tagParam ? 'Recent Posts' : 'Trending Now'}</h2>
          <div className="space-y-4">
            {postsLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="lumina-card p-5 mb-4 space-y-4">
                  <Skeleton className="h-[200px] w-full rounded-xl" />
                </div>
              ))
            ) : explorePosts?.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
