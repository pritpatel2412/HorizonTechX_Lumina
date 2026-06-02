import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreateStory, getGetStoriesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Image, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

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
  const [caption, setCaption] = useState("");
  const [textContent, setTextContent] = useState("");
  const [selectedBg, setSelectedBg] = useState(0);

  const createStory = useCreateStory();
  const queryClient = useQueryClient();

  const handleSubmit = () => {
    if (!mediaUrl.trim() && !textContent.trim() && !caption.trim()) {
      toast.error("Add an image or some text to your story");
      return;
    }

    createStory.mutate({
      data: {
        mediaUrl: mediaUrl || undefined,
        mediaType: mediaUrl ? "image" : "text",
        caption: caption || undefined,
        textContent: textContent || undefined,
        bgColor: !mediaUrl ? BG_GRADIENTS[selectedBg] : undefined,
      }
    }, {
      onSuccess: () => {
        toast.success("Story posted! 🌟");
        queryClient.invalidateQueries({ queryKey: getGetStoriesQueryKey() });
        setMediaUrl("");
        setCaption("");
        setTextContent("");
        setSelectedBg(0);
        onClose();
      },
      onError: () => {
        toast.error("Failed to post story");
      }
    });
  };

  const previewStyle: React.CSSProperties = mediaUrl
    ? {}
    : { background: BG_GRADIENTS[selectedBg] };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-surface border-white/10 sm:max-w-[420px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-white/5">
          <DialogTitle className="font-display font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            Add Story
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Preview */}
          <div
            className="w-full h-48 rounded-xl overflow-hidden relative flex items-center justify-center"
            style={previewStyle}
          >
            {mediaUrl && (
              <img src={mediaUrl} alt="Story preview" className="absolute inset-0 w-full h-full object-cover" />
            )}
            {(textContent || caption) && (
              <div className="relative z-10 px-4 text-center">
                <p className="text-white font-semibold text-lg drop-shadow-lg">{textContent || caption}</p>
              </div>
            )}
            {!mediaUrl && !textContent && !caption && (
              <p className="text-white/40 text-sm">Story preview</p>
            )}
          </div>

          {/* Background picker (only when no image) */}
          {!mediaUrl && (
            <div className="flex gap-2">
              {BG_GRADIENTS.map((bg, i) => (
                <button
                  key={i}
                  className={cn("w-8 h-8 rounded-full border-2 transition-all", selectedBg === i ? "border-white scale-110" : "border-transparent")}
                  style={{ background: bg }}
                  onClick={() => setSelectedBg(i)}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground shrink-0" />
            <Input
              placeholder="Image URL (optional)"
              className="lumina-input h-9 text-sm"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
          </div>

          <Textarea
            placeholder="Add text or caption..."
            className="min-h-[70px] bg-white/5 border border-white/10 rounded-xl focus-visible:ring-primary resize-none text-sm p-3"
            value={textContent || caption}
            onChange={(e) => {
              setTextContent(e.target.value);
              setCaption(e.target.value);
            }}
          />
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3 bg-surface-elevated">
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={(!mediaUrl.trim() && !textContent.trim() && !caption.trim()) || createStory.isPending}
            className="btn-primary px-6"
          >
            {createStory.isPending ? "Posting..." : "Share Story"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
