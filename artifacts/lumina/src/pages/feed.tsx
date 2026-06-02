import { AppLayout } from "@/components/layout/app-layout";
import { useGetFeed, getGetFeedQueryKey, useGetStories, useGetMe } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Compass } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { CreatePostModal } from "@/components/create-post-modal";

export default function FeedPage() {
  const { data: user } = useGetMe();
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data: feedPosts, isLoading: feedLoading } = useGetFeed(
    { offset, limit }, 
    { query: { queryKey: getGetFeedQueryKey({ offset, limit }) } }
  );
  
  const { data: storiesGroup, isLoading: storiesLoading } = useGetStories();

  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && feedPosts?.length === limit) {
          // Typically we would fetch next page here, mocked by doing nothing or setting offset
          // setOffset(prev => prev + limit);
        }
      },
      { threshold: 1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [feedPosts, limit]);

  return (
    <AppLayout>
      {/* Header for mobile only */}
      <div className="md:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <div className="h-3 w-3 rounded-full bg-primary" />
        </div>
        <span className="font-display text-xl font-extrabold tracking-wide">LUMINA</span>
      </div>

      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto">
        {/* Stories Bar */}
        <div className="mb-6 flex gap-4 overflow-x-auto pb-4 lumina-scrollbar w-full">
          {/* Create Story */}
          <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer w-[72px]">
            <div className="relative w-16 h-16 rounded-full border border-white/10 p-0.5">
              <div className="w-full h-full rounded-full bg-surface-elevated overflow-hidden">
                {user && (
                  <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="You" className="w-full h-full object-cover opacity-70" />
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
            storiesGroup?.map((group) => (
              <div key={group.user.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer w-[72px]">
                <div className={cn("w-16 h-16 rounded-full", group.hasUnviewed ? "story-ring" : "border border-white/10 p-0.5")}>
                  <div className="w-full h-full rounded-full overflow-hidden story-ring-inner">
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
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`} 
            alt="You"
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
          <div className="flex-1 h-10 bg-white/5 rounded-full px-4 flex items-center text-muted-foreground text-sm hover:bg-white/10 transition-colors">
            What's on your mind?
          </div>
        </div>

        {/* Feed */}
        <div className="space-y-0">
          {feedLoading ? (
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
          ) : feedPosts && feedPosts.length > 0 ? (
            <>
              {feedPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  queryKeyToInvalidate={getGetFeedQueryKey({ offset, limit })}
                />
              ))}
              <div ref={observerTarget} className="h-10 w-full" />
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
    </AppLayout>
  );
}
