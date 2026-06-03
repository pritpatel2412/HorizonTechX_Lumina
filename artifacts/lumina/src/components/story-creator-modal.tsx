import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateStory, getGetStoriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/compress-image";

interface StoryCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BG_GRADIENTS = [
  "linear-gradient(135deg, #7c6aff 0%, #ff6ab0 100%)",
  "linear-gradient(135deg, #ff6ab0 0%, #ff9a3c 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #7c6aff 100%)",
  "linear-gradient(135deg, #22d3ee 0%, #34d399 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
];

export function StoryCreatorModal({ isOpen, onClose }: StoryCreatorModalProps) {
  const [mediaUrl, setMediaUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [selectedBg, setSelectedBg] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const createStory = useCreateStory();
  const queryClient = useQueryClient();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB");
      return;
    }
    try {
      setCompressing(true);
      const dataUrl = await compressImage(file, 800);
      setMediaUrl(dataUrl);
    } catch {
      toast.error("Failed to process image");
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = () => {
    if (!mediaUrl && !textContent.trim()) {
      toast.error("Add a photo or some text to your story");
      return;
    }
    createStory.mutate({
      data: {
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? "image" : "text",
        textContent: textContent || undefined,
        bgColor: !mediaUrl ? BG_GRADIENTS[selectedBg] : undefined,
      }
    }, {
      onSuccess: () => {
        toast.success("Story posted! 🌟");
        queryClient.invalidateQueries({ queryKey: getGetStoriesQueryKey() });
        setMediaUrl(""); setTextContent(""); setSelectedBg(0);
        onClose();
      },
      onError: () => toast.error("Failed to post story")
    });
  };

  const previewStyle: React.CSSProperties = mediaUrl
    ? {}
    : { background: BG_GRADIENTS[selectedBg] };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-surface border-white/10 sm:max-w-[400px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-white/5">
          <DialogTitle className="font-display font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Add Story
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Preview */}
          <div
            className="w-full h-52 rounded-2xl overflow-hidden relative flex items-center justify-center"
            style={previewStyle}
          >
            {mediaUrl && (
              <img src={mediaUrl} alt="Story preview" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {textContent && (
              <div className="relative z-10 px-6 text-center">
                <p className="text-white font-semibold text-xl drop-shadow-lg leading-snug">{textContent}</p>
              </div>
            )}
            {!mediaUrl && !textContent && (
              <p className="text-white/40 text-sm">Story preview</p>
            )}
            {mediaUrl && (
              <button
                onClick={() => setMediaUrl("")}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-20"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Background picker (text story) */}
          {!mediaUrl && (
            <div className="flex gap-2 justify-center">
              {BG_GRADIENTS.map((bg, i) => (
                <button
                  key={i}
                  className={cn("w-8 h-8 rounded-full border-2 transition-all shrink-0", selectedBg === i ? "border-white scale-110" : "border-transparent")}
                  style={{ background: bg }}
                  onClick={() => setSelectedBg(i)}
                />
              ))}
            </div>
          )}

          {/* Upload photo button */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {!mediaUrl ? (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={compressing}
              className="w-full h-11 rounded-xl border-2 border-dashed border-white/20 hover:border-primary/50 hover:bg-primary/5 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-all"
            >
              {compressing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Processing…</span></>
              ) : (
                <><ImagePlus className="w-4 h-4" /><span className="text-sm font-medium">Upload a photo</span></>
              )}
            </button>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={compressing}
              className="w-full h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center gap-2 text-muted-foreground text-sm transition-all"
            >
              {compressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
              Change photo
            </button>
          )}

          <Textarea
            placeholder={mediaUrl ? "Add a caption…" : "Write something on your story…"}
            className="min-h-[70px] bg-white/5 border border-white/10 rounded-xl focus-visible:ring-primary resize-none text-sm p-3"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3 bg-surface-elevated">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={(!mediaUrl && !textContent.trim()) || createStory.isPending || compressing}
            className="btn-primary px-6"
          >
            {createStory.isPending ? "Posting…" : "Share Story"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
