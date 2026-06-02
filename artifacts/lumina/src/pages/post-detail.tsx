import { AppLayout } from "@/components/layout/app-layout";
import { useGetPost, useCreateComment, useToggleCommentLike, useGetPostCommentsQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function PostDetailPage() {
  const [, params] = useRoute("/post/:id");
  const postId = Number(params?.id);
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useGetPost(postId, {
    query: { enabled: !!postId }
  });

  const createComment = useCreateComment();
  const toggleLike = useToggleCommentLike();
  const [commentContent, setCommentContent] = useState("");

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || !postId) return;

    createComment.mutate({ id: postId, data: { content: commentContent } }, {
      onSuccess: () => {
        setCommentContent("");
        // In a real app we'd invalidate the getPost query or manually update cache
      }
    });
  };

  const handleLikeComment = (commentId: number) => {
    toggleLike.mutate({ commentId });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-6 pb-24">
        {isLoading ? (
          <div className="lumina-card p-5 space-y-4">
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ) : post ? (
          <>
            <PostCard post={post as any} />
            
            <div className="lumina-card p-5">
              <h3 className="font-display font-semibold text-lg mb-4">Comments</h3>
              
              <form onSubmit={handleComment} className="flex gap-3 mb-6">
                <Input 
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="lumina-input h-10 flex-1"
                />
                <Button type="submit" disabled={!commentContent.trim() || createComment.isPending} className="btn-primary h-10 px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </form>

              <div className="space-y-4">
                {post.comments?.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Link href={`/profile/${comment.author.username}`}>
                      <img src={comment.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.username}`} className="w-8 h-8 rounded-full shrink-0" />
                    </Link>
                    <div className="flex-1">
                      <div className="bg-surface-elevated p-3 rounded-2xl rounded-tl-sm inline-block">
                        <div className="font-medium text-sm text-foreground flex items-center gap-1 mb-1">
                          {comment.author.displayName}
                          {comment.author.verified && <span className="text-primary text-[10px]">✦</span>}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-muted-foreground">
                        <span>{formatDistanceToNow(new Date(comment.createdAt))}</span>
                        <button 
                          onClick={() => handleLikeComment(comment.id)}
                          className={cn("flex items-center gap-1 hover:text-secondary transition-colors", comment.liked && "text-secondary")}
                        >
                          <Heart className={cn("w-3 h-3", comment.liked && "fill-secondary")} />
                          {comment.likeCount > 0 && comment.likeCount}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Post not found.</div>
        )}
      </div>
    </AppLayout>
  );
}
