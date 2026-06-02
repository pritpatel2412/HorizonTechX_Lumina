import { AppLayout } from "@/components/layout/app-layout";
import { useGetUserProfile, useListUserPosts, useGetMe, useToggleFollow } from "@workspace/api-client-react";
import { PostCard } from "@/components/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Link as LinkIcon, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Link, useRoute } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:username");
  const username = params?.username || "";
  
  const { data: me } = useGetMe();
  const isOwnProfile = me?.username === username;

  const { data: profile, isLoading: profileLoading } = useGetUserProfile(username, {
    query: { enabled: !!username }
  });

  const { data: posts, isLoading: postsLoading } = useListUserPosts(username, {
    query: { enabled: !!username }
  });

  const toggleFollow = useToggleFollow();

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
              />
              
              {isOwnProfile ? (
                <Button variant="outline" className="border-white/20 hover:bg-white/10 rounded-xl px-6 h-10">
                  Edit Profile
                </Button>
              ) : (
                <Button 
                  className={cn("rounded-xl px-8 h-10", profile.isFollowing ? "bg-white/10 hover:bg-white/20 text-white" : "btn-primary")}
                  onClick={() => toggleFollow.mutate({ username })}
                  disabled={toggleFollow.isPending}
                >
                  {profile.isFollowing ? "Following" : "Follow"}
                </Button>
              )}
            </div>

            <div className="mb-6">
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
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}
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
              <div className="pb-3 border-b-2 border-primary font-medium text-white px-2">Posts</div>
              <div className="pb-3 text-muted-foreground hover:text-white transition-colors px-2 cursor-pointer">Media</div>
              <div className="pb-3 text-muted-foreground hover:text-white transition-colors px-2 cursor-pointer">Likes</div>
            </div>

            {/* Posts Grid */}
            <div className="space-y-4">
              {postsLoading ? (
                 Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                ))
              ) : posts && posts.length > 0 ? (
                posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No posts yet.
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        <div className="p-12 text-center">User not found</div>
      )}
    </AppLayout>
  );
}
