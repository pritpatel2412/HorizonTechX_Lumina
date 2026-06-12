import { AppLayout } from "@/components/layout/app-layout";
import { useGetFeed, getGetFeedQueryKey, useGetStories, useGetMe } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Compass } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { CreatePostModal } from "@/components/create-post-modal";
import { StoryViewerModal } from "@/components/story-viewer-modal";
import { StoryCreatorModal } from "@/components/story-creator-modal";

export default function FeedPage() {
  const { data: user } = useGetMe();
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [storyViewerGroup, setStoryViewerGroup] = useState<number | null>(null);

  const { data: feedPosts, isLoading: feedLoading } = useGetFeed(
    { offset, limit },
    { query: { queryKey: getGetFeedQueryKey({ offset, limit }) } }
  );

  const { data: storiesGroup, isLoading: storiesLoading } = useGetStories();

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = () => {
      setOffset(0);
      setAllPosts([]);
      setHasMore(true);
    };
    window.addEventListener("lumina:post-created", handler);
    return () => window.removeEventListener("lumina:post-created", handler);
  }, []);

  useEffect(() => {
    if (!feedPosts) return;
    if (offset === 0) {
      setAllPosts(feedPosts);
    } else {
      setAllPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = feedPosts.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
    }
    setHasMore(feedPosts.length === limit);
    setIsFetchingMore(false);
  }, [feedPosts, offset, limit]);

  const loadMore = useCallback(() => {
    if (isFetchingMore || !hasMore || feedLoading) return;
    setIsFetchingMore(true);
    setOffset(prev => prev + limit);
  }, [isFetchingMore, hasMore, feedLoading, limit]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.5 }
    );
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <AppLayout>
      <div className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <div className="h-3 w-3 rounded-full bg-primary" />
        </div>
        <span className="font-display text-xl font-extrabold tracking-wide">LUMINA</span>
      </div>

      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto">
        {/* Stories Bar */}
        <div className="mb-6 flex gap-4 overflow-x-auto pb-4 lumina-scrollbar w-full">
          {/* Add Story */}
          <div
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer w-[72px]"
            onClick={() => setIsCreatorOpen(true)}
          >
            <div className="relative w-16 h-16 rounded-full border border-white/10 p-0.5 hover:border-primary/50 transition-colors">
              <div className="w-full h-full rounded-full bg-surface-elevated overflow-hidden">
                {user && (
                  <img
                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                    alt="You"
                    className="w-full h-full object-cover opacity-70"
                  />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center border-2 border-background">
                <Plus className="w-3 h-3" />
              </div>
            </div>
            <span className="text-[10px] font-medium text-muted-foreground mt-1">Add Story</span>
          </div>

          {/* User Stories */}
          {storiesLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 shrink-0">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="w-12 h-2 mt-1" />
              </div>
            ))
          ) : (
            storiesGroup?.map((group, idx) => (
              <div
                key={group.user.id}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer w-[72px]"
                onClick={() => setStoryViewerGroup(idx)}
              >
                <div className={cn("w-16 h-16 rounded-full p-0.5", group.hasUnviewed ? "story-ring" : "border border-white/20")}>
                  <div className="w-full h-full rounded-full overflow-hidden">
                    <img
                      src={group.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user.username}`}
                      alt={group.user.displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="text-[10px] font-medium text-muted-foreground truncate w-full text-center mt-1">
                  {group.user.username}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Create Post Box */}
        <div
          onClick={() => setIsCreateOpen(true)}
          className="lumina-card p-4 flex items-center gap-3 mb-6 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || "user"}`}
            alt="You"
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 h-10 bg-white/5 rounded-full px-4 flex items-center text-muted-foreground text-sm hover:bg-white/10 transition-colors">
            What's on your mind?
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-0">
          {feedLoading && offset === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="lumina-card p-5 mb-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-[200px] w-full rounded-xl" />
              </div>
            ))
          ) : allPosts.length > 0 ? (
            <>
              {allPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  queryKeyToInvalidate={[...getGetFeedQueryKey({ offset: 0, limit })]}
                />
              ))}
              {hasMore && (
                <div ref={observerTarget} className="py-6 flex justify-center">
                  {isFetchingMore && (
                    <div className="space-y-4 w-full">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="lumina-card p-5 space-y-3">
                          <div className="flex gap-3">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                          <Skeleton className="h-[180px] w-full rounded-xl" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {!hasMore && allPosts.length > 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  You're all caught up ✨
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Compass className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold mb-2">Welcome to LUMINA</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
                Your feed is looking a little empty. Follow some creators to see their posts here.
              </p>
              <Link href="/explore" className="btn-primary px-6 py-2 inline-flex">
                Explore Creators
              </Link>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <StoryCreatorModal isOpen={isCreatorOpen} onClose={() => setIsCreatorOpen(false)} />
      {storyViewerGroup !== null && storiesGroup && (
        <StoryViewerModal
          groups={storiesGroup}
          initialGroupIndex={storyViewerGroup}
          onClose={() => setStoryViewerGroup(null)}
        />
      )}
    </AppLayout>
  );
}
