import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreatePost, getGetFeedQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, Loader2 } from "lucide-react";
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
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [compressing2, setCompressing2] = useState(false);
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
    createPost.mutate({
      data: {
        content,
        postType,
        imageUrl: imageUrl || undefined,
        imageUrl2: postType === "moment" ? imageUrl2 || undefined : undefined,
      }
    }, {
      onSuccess: () => {
        toast.success("Post created!");
        queryClient.removeQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ predicate: q =>
          typeof q.queryKey[0] === "string" &&
          (q.queryKey[0] as string).startsWith("/api/users/")
        });
        window.dispatchEvent(new CustomEvent("lumina:post-created"));
        setContent(""); setImageUrl(""); setImageUrl2(""); setPostType("post");
        onClose();
      },
      onError: () => toast.error("Failed to create post")
    });
  };

  const handleClose = () => { if (!createPost.isPending) onClose(); };

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
          <div className="flex gap-2 p-1 bg-surface-elevated rounded-lg">
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
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3 bg-surface-elevated">
          <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createPost.isPending || compressing || compressing2 || (postType === "moment" && (!imageUrl || !imageUrl2))}
            className="btn-primary px-6"
          >
            {createPost.isPending ? "Posting…" : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
