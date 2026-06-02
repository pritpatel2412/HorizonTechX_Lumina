import { AppLayout } from "@/components/layout/app-layout";
import { useGetSavedPosts } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark } from "lucide-react";

export default function SavedPage() {
  const { data: savedPosts, isLoading } = useGetSavedPosts();

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-6">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-primary fill-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Saved</h1>
            <p className="text-sm text-muted-foreground">Only you can see what you've saved</p>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
             Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="lumina-card p-5 mb-4 space-y-4">
                <Skeleton className="h-[200px] w-full rounded-xl" />
              </div>
            ))
          ) : savedPosts && savedPosts.length > 0 ? (
            savedPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
          ) : (
            <div className="text-center py-20 text-muted-foreground flex flex-col items-center">
              <Bookmark className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-white mb-2">No saved posts yet</p>
              <p className="text-sm">Save posts to easily find them later.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
