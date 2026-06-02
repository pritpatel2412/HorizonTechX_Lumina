import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCreatePost, getGetFeedQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Image, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"post" | "moment">("post");
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrl2, setImageUrl2] = useState("");

  const createPost = useCreatePost();
  const queryClient = useQueryClient();

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
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ predicate: q =>
          typeof q.queryKey[0] === "string" &&
          (q.queryKey[0] as string).startsWith("/api/users/")
        });
        setContent("");
        setImageUrl("");
        setImageUrl2("");
        setPostType("post");
        onClose();
      },
      onError: () => {
        toast.error("Failed to create post");
      }
    });
  };

  const handleClose = () => {
    if (!createPost.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-surface border-white/10 sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-white/5">
          <DialogTitle className="font-display font-bold">Create Post</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          <div className="flex gap-2 p-1 bg-surface-elevated rounded-lg mb-4">
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
            className="min-h-[120px] bg-transparent border-0 focus-visible:ring-0 resize-none p-0 text-lg placeholder:text-muted-foreground"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Image URL (optional)"
                className="lumina-input h-9 text-sm"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {postType === "moment" && (
              <div className="flex items-center gap-2">
                <ImagePlus className="w-4 h-4 text-secondary shrink-0" />
                <Input
                  placeholder="Second Image URL (required for Moment)"
                  className="lumina-input h-9 text-sm border-secondary/30 focus:border-secondary"
                  value={imageUrl2}
                  onChange={(e) => setImageUrl2(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3 bg-surface-elevated">
          <Button variant="ghost" onClick={handleClose} className="text-muted-foreground">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createPost.isPending || (postType === "moment" && (!imageUrl || !imageUrl2))}
            className="btn-primary px-6"
          >
            {createPost.isPending ? "Posting..." : "Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
