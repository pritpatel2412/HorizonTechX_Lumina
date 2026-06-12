import { useEffect, useRef, useState, useCallback } from "react";
import { StoryGroup, useViewStory, useDeleteStory, useGetMe, getGetStoriesQueryKey } from "@workspace/api-client-react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface StoryViewerModalProps {
  groups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

export function StoryViewerModal({ groups, initialGroupIndex, onClose }: StoryViewerModalProps) {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewStory = useViewStory();
  const deleteStory = useDeleteStory();
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();

  const DURATION = 5000;
  const TICK = 50;

  const currentGroup = groups[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];
  const isOwn = me?.id === currentGroup?.user?.id;

  const goNext = useCallback(() => {
    if (!currentGroup) return;
    if (storyIdx < currentGroup.stories.length - 1) {
      setStoryIdx(s => s + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIdx, groupIdx, currentGroup, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      setStoryIdx(groups[groupIdx - 1].stories.length - 1);
      setProgress(0);
    }
  }, [storyIdx, groupIdx, groups]);

  useEffect(() => {
    if (!currentStory) return;
    viewStory.mutate({ id: currentStory.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetStoriesQueryKey() });
      }
    });
  }, [currentStory?.id]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (paused) return;
    setProgress(0);
    timerRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          goNext();
          return 0;
        }
        return p + (TICK / DURATION) * 100;
      });
    }, TICK);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [storyIdx, groupIdx, goNext, paused]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  const handleDelete = () => {
    if (!currentStory) return;
    if (!confirm("Delete this story?")) return;
    setPaused(true);
    deleteStory.mutate({ id: currentStory.id }, {
      onSuccess: () => {
        toast.success("Story deleted");
        queryClient.invalidateQueries({ queryKey: getGetStoriesQueryKey() });
        onClose();
      },
      onError: () => {
        toast.error("Failed to delete story");
        setPaused(false);
      }
    });
  };

  if (!currentGroup || !currentStory) return null;

  const hasMedia = !!currentStory.mediaUrl;
  const bgStyle: React.CSSProperties = hasMedia
    ? {}
    : { background: currentStory.bgColor || "linear-gradient(135deg, #7c6aff 0%, #ff6ab0 100%)" };

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <div className="relative w-full max-w-sm h-full max-h-[100dvh] overflow-hidden" style={bgStyle}>
        {hasMedia && (
          <img
            src={currentStory.mediaUrl}
            alt="Story"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 pt-4">
          {currentGroup.stories.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%"
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-0 right-0 flex items-center gap-3 px-4">
          <img
            src={currentGroup.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentGroup.user.username}`}
            alt={currentGroup.user.displayName}
            className="w-10 h-10 rounded-full border-2 border-white object-cover"
          />
          <div className="flex-1">
            <div className="font-semibold text-white text-sm">{currentGroup.user.displayName}</div>
            <div className="text-white/70 text-xs">@{currentGroup.user.username}</div>
          </div>
          {isOwn && (
            <button
              onClick={handleDelete}
              className="p-2 text-white/70 hover:text-red-400 hover:bg-white/10 rounded-full transition-colors"
              title="Delete story"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-white hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text content / caption */}
        {(currentStory.caption || currentStory.textContent) && (
          <div className="absolute bottom-16 left-0 right-0 px-6 text-center">
            <p className="text-white text-lg font-medium drop-shadow-lg">
              {currentStory.caption || currentStory.textContent}
            </p>
          </div>
        )}

        {/* Tap zones */}
        <button
          className="absolute left-0 top-16 bottom-0 w-1/3"
          onClick={goPrev}
          aria-label="Previous story"
        />
        <button
          className="absolute right-0 top-16 bottom-0 w-1/3"
          onClick={goNext}
          aria-label="Next story"
        />

        {/* Group navigation hints */}
        {groupIdx > 0 && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronLeft className="w-6 h-6 text-white/50" />
          </div>
        )}
        {groupIdx < groups.length - 1 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronRight className="w-6 h-6 text-white/50" />
          </div>
        )}
      </div>

      <div className="hidden md:block absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
