import { AppLayout } from "@/components/layout/app-layout";
import { useGetPost, useCreateComment, useToggleCommentLike, getGetPostQueryKey } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRoute, Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Heart, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function PostDetailPage() {
  const [, params] = useRoute("/post/:id");
  const postId = Number(params?.id);
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useGetPost(postId, {
    query: { queryKey: getGetPostQueryKey(postId), enabled: !!postId }
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
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
      }
    });
  };

  const handleLikeComment = (commentId: number) => {
    toggleLike.mutate({ commentId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
      }
    });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-4 pb-24">
        <button
          onClick={() => navigate("~/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {isLoading ? (
          <div className="lumina-card p-5 space-y-4">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ) : post ? (
          <>
            <PostCard post={post as any} queryKeyToInvalidate={[...getGetPostQueryKey(postId)]} />

            <div className="lumina-card p-5">
              <h3 className="font-display font-semibold text-lg mb-4">Comments ({post.comments?.length ?? 0})</h3>

              <form onSubmit={handleComment} className="flex gap-3 mb-6">
                <Input
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="lumina-input h-10 flex-1"
                />
                <Button
                  type="submit"
                  disabled={!commentContent.trim() || createComment.isPending}
                  className="btn-primary h-10 px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>

              {post.comments && post.comments.length > 0 ? (
                <div className="space-y-4">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="flex gap-3">
                      <Link href={`/profile/${comment.author.username}`}>
                        <img
                          src={comment.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.username}`}
                          className="w-8 h-8 rounded-full shrink-0 object-cover"
                          alt={comment.author.displayName}
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="bg-surface-elevated p-3 rounded-2xl rounded-tl-sm inline-block max-w-full">
                          <div className="font-medium text-sm text-foreground flex items-center gap-1 mb-1">
                            {comment.author.displayName}
                            {comment.author.verified && <span className="text-primary text-[10px]">✦</span>}
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1 ml-2 text-xs text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
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
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No comments yet. Be the first!
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">Post not found.</div>
        )}
      </div>
    </AppLayout>
  );
}
