import { FeedPost, useTogglePostLike, useTogglePostSave, useDeletePost, useGetMe, usePinPost } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, X, Trash2, Link as LinkIcon, Lock, Pin, Clock } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PostCardProps {
  post: FeedPost;
  queryKeyToInvalidate?: unknown[];
}

export function PostCard({ post, queryKeyToInvalidate }: PostCardProps) {
  const toggleLike = useTogglePostLike();
  const toggleSave = useTogglePostSave();
  const deletePost = useDeletePost();
  const pinPost = usePinPost();
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();

  const [localLiked, setLocalLiked] = useState(post.liked ?? false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount ?? 0);
  const [localSaved, setLocalSaved] = useState(post.saved ?? false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [spotlightImage, setSpotlightImage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = () => {
    longPressTimeoutRef.current = setTimeout(() => {
      setShowReactions(true);
      if (typeof window !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch (_) {}
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    };
  }, []);

  const isOwn = me?.id === post.author.id;

  useEffect(() => {
    setLocalLiked(post.liked ?? false);
    setLocalLikeCount(post.likeCount ?? 0);
    setLocalSaved(post.saved ?? false);
  }, [post.liked, post.likeCount, post.saved]);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

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

  const handleDelete = () => {
    setShowMenu(false);
    if (!confirm("Delete this post? This cannot be undone.")) return;
    deletePost.mutate({ id: post.id }, {
      onSuccess: () => {
        toast.success("Post deleted");
        queryClient.invalidateQueries({ predicate: q =>
          typeof q.queryKey[0] === "string" &&
          (q.queryKey[0] as string).startsWith("/api/posts")
        });
        queryClient.invalidateQueries({ predicate: q =>
          typeof q.queryKey[0] === "string" &&
          (q.queryKey[0] as string).startsWith("/api/users/")
        });
      },
      onError: () => toast.error("Failed to delete post")
    });
  };

  const handlePin = () => {
    setShowMenu(false);
    pinPost.mutate({ id: post.id }, {
      onSuccess: (data) => {
        toast.success(data.isPinned ? "Post pinned to your profile" : "Post unpinned");
        queryClient.invalidateQueries({ predicate: q =>
          typeof q.queryKey[0] === "string" &&
          (q.queryKey[0] as string).startsWith("/api/users/")
        });
      },
      onError: (err: any) => toast.error(err?.error || "Failed to pin post")
    });
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
      <div className="lumina-card p-5 mb-4 animate-in fade-in slide-in-from-bottom-2" onClick={() => { setShowReactions(false); setShowMenu(false); }}>
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
            {post.isPinned && (
              <span title="Pinned post" className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                <Pin className="w-2.5 h-2.5" />
                Pinned
              </span>
            )}
            {(post as any).audience === "circle" && (
              <span title="Close Friends only" className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                <Lock className="w-2.5 h-2.5" />
                Circle
              </span>
            )}
            {post.scheduledAt && new Date(post.scheduledAt) > new Date() ? (
              <span title={`Scheduled for ${new Date(post.scheduledAt).toLocaleString()}`} className="flex items-center gap-1 text-[10px] font-medium text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded-full border border-sky-500/20">
                <Clock className="w-2.5 h-2.5" />
                Scheduled
              </span>
            ) : (
              <span className="text-xs">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            )}

            {/* More menu */}
            <div className="relative" ref={menuRef}>
              <button
                className="p-1.5 hover:bg-white/5 rounded-md transition-colors"
                onClick={(e) => { e.stopPropagation(); setShowMenu(m => !m); }}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-surface-elevated border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1">
                  <button
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-white/5 transition-colors text-left"
                    onClick={(e) => { e.stopPropagation(); handleShare(e); setShowMenu(false); }}
                  >
                    <LinkIcon className="w-4 h-4" />
                    Copy link
                  </button>
                  {isOwn && (
                    <>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-amber-500/10 text-amber-400 transition-colors text-left"
                        onClick={(e) => { e.stopPropagation(); handlePin(); }}
                      >
                        <Pin className="w-4 h-4" />
                        {post.isPinned ? "Unpin post" : "Pin to profile"}
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
                        onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete post
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">
          {renderContent(post.content)}
        </div>

        {isMoment ? (
          <div className="flex gap-2 mb-4 h-[200px] sm:h-[300px] rounded-xl overflow-hidden p-1 bg-gradient-to-br from-primary to-secondary">
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
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
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
                <div className="absolute bottom-full left-0 mb-2 bg-surface-elevated border border-white/10 rounded-full p-1.5 sm:p-2 flex items-center gap-1 sm:gap-2 shadow-xl animate-in slide-in-from-bottom-2 z-10 whitespace-nowrap">
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
