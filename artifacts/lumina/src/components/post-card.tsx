import { FeedPost, useTogglePostLike, useTogglePostSave } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, X } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PostCardProps {
  post: FeedPost;
  queryKeyToInvalidate?: unknown[];
}

export function PostCard({ post, queryKeyToInvalidate }: PostCardProps) {
  const toggleLike = useTogglePostLike();
  const toggleSave = useTogglePostSave();
  const queryClient = useQueryClient();

  const [localLiked, setLocalLiked] = useState(post.liked ?? false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount ?? 0);
  const [localSaved, setLocalSaved] = useState(post.saved ?? false);
  const [showReactions, setShowReactions] = useState(false);
  const [spotlightImage, setSpotlightImage] = useState<string | null>(null);

  useEffect(() => {
    setLocalLiked(post.liked ?? false);
    setLocalLikeCount(post.likeCount ?? 0);
    setLocalSaved(post.saved ?? false);
  }, [post.liked, post.likeCount, post.saved]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ predicate: q =>
      typeof q.queryKey[0] === "string" &&
      (q.queryKey[0] as string).startsWith("/api/posts")
    });
    if (queryKeyToInvalidate) {
      queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
    }
  };

  const handleLike = (e: React.MouseEvent, reaction?: string) => {
    e.preventDefault();
    e.stopPropagation();
    const wasLiked = localLiked;
    if (reaction) {
      setLocalLiked(true);
      if (!wasLiked) setLocalLikeCount(c => c + 1);
    } else {
      setLocalLiked(!wasLiked);
      setLocalLikeCount(c => wasLiked ? c - 1 : c + 1);
    }
    setShowReactions(false);
    toggleLike.mutate({ id: post.id, data: reaction ? { reaction } : undefined }, {
      onSuccess: invalidateAll,
      onError: () => {
        setLocalLiked(wasLiked);
        setLocalLikeCount(post.likeCount ?? 0);
      }
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalSaved(s => !s);
    toggleSave.mutate({ id: post.id }, {
      onSuccess: invalidateAll,
      onError: () => setLocalSaved(post.saved ?? false)
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success("Link copied to clipboard");
  };

  const renderContent = (text: string) => {
    return text.split(/(#\w+)/g).map((part, i) => {
      if (part.startsWith("#")) {
        return (
          <Link key={i} href={`/explore?tag=${encodeURIComponent(part.substring(1))}`} className="text-primary hover:underline cursor-pointer">
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const isMoment = post.postType === "moment" && post.imageUrl && post.imageUrl2;

  return (
    <>
      <div className="lumina-card p-5 mb-4 animate-in fade-in slide-in-from-bottom-2" onClick={() => setShowReactions(false)}>
        <div className="flex items-center justify-between mb-4">
          <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 group">
            <img
              src={post.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`}
              alt={post.author.displayName}
              className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/10 group-hover:border-primary/50 transition-colors"
            />
            <div>
              <div className="font-medium text-foreground flex items-center gap-1">
                {post.author.displayName}
                {post.author.verified && <span className="text-primary text-[10px]">✦</span>}
              </div>
              <div className="text-xs text-muted-foreground">@{post.author.username}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-xs">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            <button className="p-1.5 hover:bg-white/5 rounded-md transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">
          {renderContent(post.content)}
        </div>

        {isMoment ? (
          <div className="flex gap-2 mb-4 h-[300px] sm:h-[400px] rounded-xl overflow-hidden p-1 bg-gradient-to-br from-primary to-secondary">
            <div className="flex-1 h-full rounded-l-lg overflow-hidden bg-black cursor-pointer">
              <img
                src={post.imageUrl!}
                alt="Moment 1"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onDoubleClick={() => setSpotlightImage(post.imageUrl!)}
              />
            </div>
            <div className="flex-1 h-full rounded-r-lg overflow-hidden bg-black cursor-pointer">
              <img
                src={post.imageUrl2!}
                alt="Moment 2"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                onDoubleClick={() => setSpotlightImage(post.imageUrl2!)}
              />
            </div>
          </div>
        ) : post.imageUrl ? (
          <div className="mb-4 rounded-xl overflow-hidden bg-black max-h-[500px] cursor-pointer border border-white/5">
            <img
              src={post.imageUrl}
              alt="Post media"
              className="w-full object-contain max-h-[500px] hover:scale-[1.02] transition-transform duration-500"
              onDoubleClick={() => setSpotlightImage(post.imageUrl!)}
            />
          </div>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-6">
            <div className="relative">
              <button
                className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors group"
                onClick={handleLike}
                onContextMenu={(e) => { e.preventDefault(); setShowReactions(r => !r); }}
              >
                <Heart
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    localLiked && "fill-secondary text-secondary scale-110",
                    "group-active:scale-125"
                  )}
                />
                <span className={cn("text-sm font-medium", localLiked && "text-secondary")}>{localLikeCount}</span>
              </button>

              {showReactions && (
                <div className="absolute bottom-full left-0 mb-2 bg-surface-elevated border border-white/10 rounded-full p-2 flex items-center gap-2 shadow-xl animate-in slide-in-from-bottom-2 z-10">
                  {["❤️", "🔥", "😂", "😮", "😢", "👏"].map(emoji => (
                    <button
                      key={emoji}
                      className="text-xl hover:scale-125 transition-transform px-1"
                      onClick={(e) => handleLike(e, emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link href={`/post/${post.id}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">{post.commentCount}</span>
            </Link>

            <button className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          <button
            className={cn("text-muted-foreground transition-colors hover:text-white", localSaved && "text-primary")}
            onClick={handleSave}
          >
            <Bookmark className={cn("w-5 h-5", localSaved && "fill-primary text-primary")} />
          </button>
        </div>

        {post.topReactions && post.topReactions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
            <div className="flex -space-x-1">
              {post.topReactions.slice(0, 3).map((reaction, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center text-xs border border-surface"
                  style={{ zIndex: 10 - i }}
                >
                  {reaction.reaction}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">reacted</span>
          </div>
        )}
      </div>

      {spotlightImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSpotlightImage(null)}
        >
          <button
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setSpotlightImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={spotlightImage}
            alt="Spotlight"
            className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200"
          />
        </div>
      )}
    </>
  );
}
