import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreatePost, getGetFeedQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, Loader2, Globe, Lock, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compress-image";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"post" | "moment">("post");
  const [audience, setAudience] = useState<"public" | "circle">("public");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [compressing2, setCompressing2] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);

  const createPost = useCreatePost();
  const queryClient = useQueryClient();

  const handleFile = async (file: File, slot: 1 | 2) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    try {
      slot === 1 ? setCompressing(true) : setCompressing2(true);
      const dataUrl = await compressImage(file);
      slot === 1 ? setImageUrl(dataUrl) : setImageUrl2(dataUrl);
    } catch {
      toast.error("Failed to process image");
    } finally {
      slot === 1 ? setCompressing(false) : setCompressing2(false);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) return;

    if (scheduleEnabled && scheduledAt) {
      const scheduled = new Date(scheduledAt);
      if (scheduled <= new Date()) {
        toast.error("Scheduled time must be in the future");
        return;
      }
    }

    createPost.mutate({
      data: {
        content,
        postType,
        audience,
        imageUrl: imageUrl || undefined,
        imageUrl2: postType === "moment" ? imageUrl2 || undefined : undefined,
        scheduledAt: scheduleEnabled && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      }
    }, {
      onSuccess: () => {
        if (scheduleEnabled && scheduledAt) {
          const scheduled = new Date(scheduledAt);
          toast.success(`Post scheduled for ${scheduled.toLocaleDateString()} at ${scheduled.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
        } else {
          toast.success(audience === "circle" ? "Posted to your Circle 🔒" : "Post created!");
        }
        queryClient.removeQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ predicate: q =>
          typeof q.queryKey[0] === "string" &&
          (q.queryKey[0] as string).startsWith("/api/users/")
        });
        window.dispatchEvent(new CustomEvent("lumina:post-created"));
        setContent(""); setImageUrl(""); setImageUrl2(""); setPostType("post"); setAudience("public");
        setScheduleEnabled(false); setScheduledAt("");
        onClose();
      },
      onError: () => toast.error("Failed to create post")
    });
  };

  const handleClose = () => { if (!createPost.isPending) onClose(); };

  const minDateTimeLocal = new Date(Date.now() + 5 * 60 * 1000)
    .toISOString().slice(0, 16);

  const ImageSlot = ({
    value, onFile, onClear, isCompressing, slot, accent
  }: {
    value: string; onFile: (f: File) => void; onClear: () => void;
    isCompressing: boolean; slot: 1 | 2; accent?: boolean;
  }) => {
    const ref = slot === 1 ? fileRef1 : fileRef2;
    return (
      <div className="relative group">
        <input
          ref={ref}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        {value ? (
          <div className="relative rounded-xl overflow-hidden bg-black border border-white/10">
            <img src={value} alt="Preview" className="w-full max-h-[300px] object-contain" />
            <button
              onClick={onClear}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => ref.current?.click()}
              className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-medium transition-colors"
            >
              Change
            </button>
          </div>
        ) : (
          <button
            onClick={() => ref.current?.click()}
            disabled={isCompressing}
            className={cn(
              "w-full h-[140px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all",
              accent
                ? "border-secondary/40 hover:border-secondary/70 hover:bg-secondary/5 text-secondary"
                : "border-white/15 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground"
            )}
          >
            {isCompressing ? (
              <><Loader2 className="w-6 h-6 animate-spin" /><span className="text-sm">Processing…</span></>
            ) : (
              <><ImagePlus className="w-6 h-6" /><span className="text-sm font-medium">{slot === 2 ? "Second image" : "Add photo"}</span><span className="text-xs opacity-60">Click or drag to upload</span></>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-surface border-white/10 sm:max-w-[520px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-white/5">
          <DialogTitle className="font-display font-bold">Create Post</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4 max-h-[80vh] overflow-y-auto lumina-scrollbar">
          <div className="flex gap-2">
            <div className="flex gap-1 p-1 bg-surface-elevated rounded-lg flex-1">
              <button
                className={cn("flex-1 py-1.5 text-sm rounded-md font-medium transition-colors", postType === "post" ? "bg-white/10 text-white" : "text-muted-foreground")}
                onClick={() => setPostType("post")}
              >
                Standard
              </button>
              <button
                className={cn("flex-1 py-1.5 text-sm rounded-md font-medium transition-colors", postType === "moment" ? "bg-primary text-white" : "text-muted-foreground")}
                onClick={() => setPostType("moment")}
              >
                Moment ✨
              </button>
            </div>
            <div className="flex gap-1 p-1 bg-surface-elevated rounded-lg">
              <button
                title="Visible to everyone"
                className={cn("px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-sm font-medium", audience === "public" ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
                onClick={() => setAudience("public")}
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Public</span>
              </button>
              <button
                title="Only visible to your Close Friends circle"
                className={cn("px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 text-sm font-medium", audience === "circle" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-white")}
                onClick={() => setAudience("circle")}
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Circle</span>
              </button>
            </div>
          </div>

          {audience === "circle" && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              Only your Close Friends circle will see this post.
            </div>
          )}

          <Textarea
            placeholder="What's on your mind?"
            className="min-h-[100px] bg-transparent border-0 focus-visible:ring-0 resize-none p-0 text-lg placeholder:text-muted-foreground"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {postType === "moment" ? (
            <div className="grid grid-cols-2 gap-3">
              <ImageSlot value={imageUrl} onFile={(f) => handleFile(f, 1)} onClear={() => setImageUrl("")} isCompressing={compressing} slot={1} />
              <ImageSlot value={imageUrl2} onFile={(f) => handleFile(f, 2)} onClear={() => setImageUrl2("")} isCompressing={compressing2} slot={2} accent />
            </div>
          ) : (
            <ImageSlot value={imageUrl} onFile={(f) => handleFile(f, 1)} onClear={() => setImageUrl("")} isCompressing={compressing} slot={1} />
          )}

          {/* Schedule toggle */}
          <div className="border-t border-white/5 pt-3">
            <button
              className={cn(
                "flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg w-full transition-colors",
                scheduleEnabled ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}
              onClick={() => { setScheduleEnabled(s => !s); if (scheduleEnabled) setScheduledAt(""); }}
            >
              <Clock className="w-4 h-4" />
              {scheduleEnabled ? "Scheduling enabled — tap to cancel" : "Schedule for later"}
            </button>

            {scheduleEnabled && (
              <div className="mt-2 animate-in slide-in-from-top-1">
                <input
                  type="datetime-local"
                  min={minDateTimeLocal}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full bg-surface-elevated border border-sky-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/60 [color-scheme:dark]"
                />
                {scheduledAt && (
                  <p className="text-xs text-sky-400 mt-1.5 px-1">
                    Will publish on {new Date(scheduledAt).toLocaleDateString()} at {new Date(scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3 bg-surface-elevated">
          <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !content.trim() || createPost.isPending || compressing || compressing2 ||
              (postType === "moment" && (!imageUrl || !imageUrl2)) ||
              (scheduleEnabled && !scheduledAt)
            }
            className={cn("px-6", scheduleEnabled ? "bg-sky-600 hover:bg-sky-700 text-white" : "btn-primary")}
          >
            {createPost.isPending
              ? "Posting…"
              : scheduleEnabled
              ? "Schedule Post"
              : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
