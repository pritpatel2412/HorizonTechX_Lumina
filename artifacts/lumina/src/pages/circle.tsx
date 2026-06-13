import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetCircleMembers, useAddCircleMember, useRemoveCircleMember,
  getGetCircleMembersQueryKey, useSearchUsers, getSearchUsersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, UserPlus, X, Search, Users, Globe, Info } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/lib/use-debounce";

export default function CirclePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: members, isLoading } = useGetCircleMembers({
    query: { queryKey: getGetCircleMembersQueryKey() }
  });

  const { data: searchResults } = useSearchUsers(
    { q: debouncedSearch },
    { query: { queryKey: getSearchUsersQueryKey({ q: debouncedSearch }), enabled: debouncedSearch.length >= 2 } }
  );

  const addMember = useAddCircleMember();
  const removeMember = useRemoveCircleMember();

  const memberIds = new Set(members?.map(m => m.id) ?? []);

  const handleAdd = (username: string) => {
    addMember.mutate({ username }, {
      onSuccess: () => {
        toast.success(`@${username} added to your Circle`);
        queryClient.invalidateQueries({ queryKey: getGetCircleMembersQueryKey() });
        setSearch("");
      },
      onError: () => toast.error("Could not add member")
    });
  };

  const handleRemove = (username: string) => {
    removeMember.mutate({ username }, {
      onSuccess: () => {
        toast.success(`@${username} removed from your Circle`);
        queryClient.invalidateQueries({ queryKey: getGetCircleMembersQueryKey() });
      },
      onError: () => toast.error("Could not remove member")
    });
  };

  const showDropdown = debouncedSearch.length >= 2 && searchResults && searchResults.length > 0;

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-white/5 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white leading-tight">Close Friends</h1>
              <p className="text-xs text-muted-foreground">{members?.length ?? 0} members</p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6 space-y-6">
          {/* Explainer */}
          <div className="flex gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>When you post with <span className="text-emerald-400 font-medium">🔒 Circle</span>, only the people in this list will see it in their feed.</p>
              <p>They won't be notified that they're in your Circle.</p>
            </div>
          </div>

          {/* Audience legend */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Public</div>
                <div className="text-xs text-muted-foreground">All followers see it</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-medium text-emerald-400">Circle</div>
                <div className="text-xs text-muted-foreground">Only this list</div>
              </div>
            </div>
          </div>

          {/* Search to add */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Add people</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by username…"
                className="lumina-input pl-9"
              />
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-elevated border border-white/10 rounded-xl shadow-xl z-30 overflow-hidden">
                  {searchResults.map(user => {
                    const alreadyIn = memberIds.has(user.id);
                    return (
                      <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                        <img
                          src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                          className="w-8 h-8 rounded-full object-cover border border-white/10"
                          alt={user.displayName}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate flex items-center gap-1">
                            {user.displayName}
                            {user.verified && <span className="text-primary text-[10px]">✦</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">@{user.username}</div>
                        </div>
                        {alreadyIn ? (
                          <span className="text-xs text-emerald-400 font-medium">In Circle</span>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs"
                            onClick={() => handleAdd(user.username)}
                            disabled={addMember.isPending}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Your Circle
              </span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : members && members.length > 0 ? (
              <div className="space-y-2">
                {members.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors group">
                    <Link href={`/profile/${member.username}`}>
                      <img
                        src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                        alt={member.displayName}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${member.username}`} className="text-sm font-medium text-white hover:text-primary transition-colors flex items-center gap-1">
                        {member.displayName}
                        {member.verified && <span className="text-primary text-[10px]">✦</span>}
                      </Link>
                      <div className="text-xs text-muted-foreground">@{member.username}</div>
                    </div>
                    <button
                      onClick={() => handleRemove(member.username)}
                      disabled={removeMember.isPending}
                      className={cn(
                        "p-1.5 rounded-lg transition-colors shrink-0",
                        "text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100",
                        "hover:bg-destructive/10 hover:text-destructive"
                      )}
                      title="Remove from Circle"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-white mb-1">Your Circle is empty</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">Search for people above to add them. Posts shared with Circle will only be visible to them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
