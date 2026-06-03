import { AppLayout } from "@/components/layout/app-layout";
import { useGetExplorePosts, useSearchUsers, useGetUserSuggestions, useGetTrendingTags, getSearchUsersQueryKey, getGetExplorePostsQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Hash, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToggleFollow } from "@workspace/api-client-react";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [, navigate] = useLocation();

  const searchString = useSearch();
  const tagParam = new URLSearchParams(searchString).get("tag");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(
    { q: debouncedQuery },
    { query: { queryKey: getSearchUsersQueryKey({ q: debouncedQuery }), enabled: debouncedQuery.length > 0 } }
  );

  const { data: explorePosts, isLoading: postsLoading } = useGetExplorePosts(
    { offset: 0, limit: 20, tag: tagParam ?? undefined },
    { query: { queryKey: getGetExplorePostsQueryKey({ offset: 0, limit: 20, tag: tagParam ?? undefined }) } }
  );

  const { data: trendingTags } = useGetTrendingTags();
  const { data: suggestions, isLoading: suggestionsLoading } = useGetUserSuggestions();
  const toggleFollow = useToggleFollow();

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-8 pb-20">

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

          {debouncedQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-elevated border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map(user => (
                  <Link key={user.id} href={`/profile/${user.username}`} onClick={() => setSearchQuery("")} className="flex items-center gap-3 p-4 hover:bg-white/5 transition-colors">
                    <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <div>
                      <div className="font-medium text-foreground flex items-center gap-1">
                        {user.displayName} {user.verified && <span className="text-primary text-[10px]">✦</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">No users found for "{debouncedQuery}"</div>
              )}
            </div>
          )}
        </div>

        {/* Tag filter banner */}
        {tagParam && (
          <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 p-4 rounded-xl text-primary">
            <Hash className="w-6 h-6 shrink-0" />
            <h1 className="font-display text-xl font-bold flex-1">#{tagParam}</h1>
            <button
              onClick={() => navigate("/explore")}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors text-white"
            >
              Clear filter
            </button>
          </div>
        )}

        {/* Trending Hashtags */}
        {!tagParam && trendingTags && trendingTags.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-lg mb-3 text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Trending Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {trendingTags.slice(0, 8).map(tag => (
                <button
                  key={tag.tag}
                  onClick={() => navigate(`/explore?tag=${encodeURIComponent(tag.tag)}`)}
                  className="px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-colors"
                >
                  #{tag.tag} <span className="text-primary/60 text-xs ml-1">{tag.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rising Creators */}
        {!tagParam && (
          <div>
            <h2 className="font-display font-bold text-xl mb-4 text-white">Rising Creators</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 lumina-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {suggestionsLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="w-[150px] h-[200px] rounded-xl shrink-0" />)
              ) : suggestions?.map(user => (
                <div key={user.id} className="lumina-card p-4 flex flex-col items-center text-center w-[150px] shrink-0 gap-3">
                  <Link href={`/profile/${user.username}`}>
                    <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} className="w-16 h-16 rounded-full mx-auto lumina-avatar-ring mb-2 object-cover" alt="" />
                    <div className="font-medium text-sm text-foreground truncate w-full flex items-center justify-center gap-1">
                      {user.displayName} {user.verified && <span className="text-primary text-[8px]">✦</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate w-full">@{user.username}</div>
                  </Link>
                  <Button
                    size="sm"
                    className={cn("w-full mt-auto h-8 text-xs", user.isFollowing ? "bg-white/10 text-white hover:bg-white/20" : "btn-primary")}
                    onClick={() => toggleFollow.mutate({ username: user.username })}
                  >
                    {user.isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trending / Filtered Posts */}
        <div>
          <h2 className="font-display font-bold text-xl mb-4 text-white">
            {tagParam ? `Posts tagged #${tagParam}` : "Trending Now"}
          </h2>
          <div className="space-y-4">
            {postsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="lumina-card p-5 space-y-4"><Skeleton className="h-[200px] w-full rounded-xl" /></div>
              ))
            ) : explorePosts && explorePosts.length > 0 ? (
              explorePosts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {tagParam ? `No posts found for #${tagParam}` : "No trending posts yet"}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
