import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetUserProfile, useListUserPosts, useGetMe, useToggleFollow,
  useUpdateProfile, getGetUserProfileQueryKey, getGetMeQueryKey, getListUserPostsQueryKey
} from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Link as LinkIcon, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username || "";

  const { data: me } = useGetMe();
  const isOwnProfile = me?.username === username;
  const queryClient = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(username, {
    query: { queryKey: getGetUserProfileQueryKey(username), enabled: !!username }
  });

  const { data: posts, isLoading: postsLoading } = useListUserPosts(username, {
    query: { queryKey: getListUserPostsQueryKey(username), enabled: !!username }
  });

  const toggleFollow = useToggleFollow();
  const updateProfile = useUpdateProfile();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
    location: "",
    website: "",
    avatarUrl: "",
    coverUrl: "",
  });

  useEffect(() => {
    if (profile && isOwnProfile) {
      setEditForm({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        location: profile.location || "",
        website: profile.website || "",
        avatarUrl: profile.avatarUrl || "",
        coverUrl: profile.coverUrl || "",
      });
    }
  }, [profile, isOwnProfile]);

  const handleFollow = () => {
    toggleFollow.mutate({ username }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username) });
      }
    });
  };

  const handleEditSave = () => {
    updateProfile.mutate({ data: editForm }, {
      onSuccess: () => {
        toast.success("Profile updated!");
        queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey(username) });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setIsEditOpen(false);
      },
      onError: () => {
        toast.error("Failed to update profile");
      }
    });
  };

  const [activeTab, setActiveTab] = useState<"posts" | "media">("posts");
  const mediaPosts = posts?.filter(p => p.imageUrl);

  return (
    <AppLayout>
      {profileLoading ? (
        <div className="w-full">
          <Skeleton className="h-48 w-full" />
          <div className="px-6 -mt-16 relative z-10">
            <Skeleton className="w-32 h-32 rounded-full border-4 border-background" />
            <div className="mt-4 space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </div>
      ) : profile ? (
        <div className="w-full pb-20">
          {/* Cover Photo */}
          <div className="h-48 md:h-64 w-full bg-gradient-to-br from-primary/20 to-secondary/20 relative">
            {profile.coverUrl && (
              <img src={profile.coverUrl} className="w-full h-full object-cover" alt="Cover" />
            )}
          </div>

          {/* Profile Header */}
          <div className="px-4 sm:px-6 -mt-16 relative z-10 max-w-2xl mx-auto">
            <div className="flex justify-between items-end mb-4">
              <img
                src={profile.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                className="w-32 h-32 rounded-full border-4 border-background object-cover bg-surface"
                alt={profile.displayName}
              />

              {isOwnProfile ? (
                <Button
                  variant="outline"
                  className="border-white/20 hover:bg-white/10 rounded-xl px-6 h-10"
                  onClick={() => setIsEditOpen(true)}
                >
                  Edit Profile
                </Button>
              ) : (
                <Button
                  className={cn("rounded-xl px-8 h-10", profile.isFollowing ? "bg-white/10 hover:bg-white/20 text-white" : "btn-primary")}
                  onClick={handleFollow}
                  disabled={toggleFollow.isPending}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>

            <div className="mb-4">
              <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
                {profile.displayName}
                {profile.verified && <span className="text-primary text-sm">✦</span>}
              </h1>
              <p className="text-muted-foreground">@{profile.username}</p>
            </div>

            {profile.bio && (
              <p className="text-sm text-foreground mb-4 leading-relaxed max-w-md">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mb-6">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {profile.location}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Joined {format(new Date(profile.createdAt), "MMMM yyyy")}
              </div>
            </div>

            <div className="flex gap-6 mb-8 border-b border-white/10 pb-6">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-white">{profile.postCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Posts</span>
              </div>
              <div className="flex flex-col cursor-pointer hover:opacity-80">
                <span className="font-bold text-lg text-white">{profile.followerCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Followers</span>
              </div>
              <div className="flex flex-col cursor-pointer hover:opacity-80">
                <span className="font-bold text-lg text-white">{profile.followingCount}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Following</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-white/10 mb-6">
              <button
                className={cn("pb-3 px-2 font-medium transition-colors border-b-2 -mb-px", activeTab === "posts" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white")}
                onClick={() => setActiveTab("posts")}
              >
                Posts
              </button>
              <button
                className={cn("pb-3 px-2 font-medium transition-colors border-b-2 -mb-px", activeTab === "media" ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white")}
                onClick={() => setActiveTab("media")}
              >
                Media
              </button>
            </div>

            {/* Posts / Media Grid */}
            {postsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                ))}
              </div>
            ) : activeTab === "posts" ? (
              posts && posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map(post => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No posts yet.</div>
              )
            ) : (
              mediaPosts && mediaPosts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {mediaPosts.map(post => (
                    <Link key={post.id} href={`/post/${post.id}`}>
                      <div className="aspect-square bg-surface-elevated rounded-sm overflow-hidden">
                        <img src={post.imageUrl!} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No media posts yet.</div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center">User not found</div>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onOpenChange={(o) => !o && setIsEditOpen(false)}>
        <DialogContent className="bg-surface border-white/10 sm:max-w-[480px] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between">
            <DialogTitle className="font-display font-bold">Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto lumina-scrollbar">
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <img
                src={editForm.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                alt="Avatar preview"
              />
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Avatar URL</label>
                <Input
                  placeholder="https://..."
                  className="lumina-input h-9 text-sm"
                  value={editForm.avatarUrl}
                  onChange={(e) => setEditForm(f => ({ ...f, avatarUrl: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cover Photo URL</label>
              <Input
                placeholder="https://..."
                className="lumina-input h-9 text-sm"
                value={editForm.coverUrl}
                onChange={(e) => setEditForm(f => ({ ...f, coverUrl: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Display Name</label>
              <Input
                placeholder="Your name"
                className="lumina-input h-9"
                value={editForm.displayName}
                onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bio</label>
              <Textarea
                placeholder="Tell the world about yourself..."
                className="lumina-input min-h-[80px] resize-none"
                value={editForm.bio}
                onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <Input
                placeholder="City, Country"
                className="lumina-input h-9"
                value={editForm.location}
                onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Website</label>
              <Input
                placeholder="https://yoursite.com"
                className="lumina-input h-9"
                value={editForm.website}
                onChange={(e) => setEditForm(f => ({ ...f, website: e.target.value }))}
              />
            </div>
          </div>

          <div className="p-4 border-t border-white/5 flex gap-3 justify-end bg-surface-elevated">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="text-muted-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={updateProfile.isPending}
              className="btn-primary px-6"
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
