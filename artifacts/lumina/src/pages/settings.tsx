import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, useUpdateProfile, useChangePassword } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";

export default function SettingsPage() {
  const { data: user } = useGetMe();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [profileData, setProfileData] = useState({
    displayName: "", bio: "", website: "", location: "", avatarUrl: "", coverUrl: ""
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: "", newPassword: "", confirmPassword: ""
  });
  const [compressingAvatar, setCompressingAvatar] = useState(false);
  const [compressingCover, setCompressingCover] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.displayName || "",
        bio: user.bio || "",
        website: user.website || "",
        location: user.location || "",
        avatarUrl: user.avatarUrl || "",
        coverUrl: user.coverUrl || ""
      });
    }
  }, [user]);

  const handleImageUpload = async (file: File, field: "avatarUrl" | "coverUrl") => {
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    try {
      field === "avatarUrl" ? setCompressingAvatar(true) : setCompressingCover(true);
      const dataUrl = await compressImage(file, field === "avatarUrl" ? 400 : 1200);
      setProfileData(p => ({ ...p, [field]: dataUrl }));
    } catch { toast.error("Failed to process image"); }
    finally { field === "avatarUrl" ? setCompressingAvatar(false) : setCompressingCover(false); }
  };

  const handleProfileSave = () => {
    updateProfile.mutate({ data: profileData }, {
      onSuccess: () => toast.success("Profile updated successfully"),
      onError: () => toast.error("Failed to update profile")
    });
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    changePassword.mutate({
      data: { oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword }
    }, {
      onSuccess: () => {
        toast.success("Password changed successfully");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      },
      onError: (err: any) => toast.error(err?.error || "Failed to change password. Check current password.")
    });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-8 pb-20">
        <h1 className="font-display text-2xl font-bold text-white">Settings</h1>

        <div className="lumina-card p-6 space-y-6">
          <h2 className="font-display text-lg font-semibold border-b border-white/10 pb-4">Edit Profile</h2>

          {/* Cover photo */}
          <div className="space-y-2">
            <Label>Cover Photo</Label>
            <div
              className="relative h-28 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 group cursor-pointer"
              onClick={() => coverRef.current?.click()}
            >
              {profileData.coverUrl && <img src={profileData.coverUrl} className="w-full h-full object-cover" alt="" />}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {compressingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {compressingCover ? "Processing…" : "Upload Cover Photo"}
              </div>
            </div>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "coverUrl")} />
          </div>

          {/* Avatar */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer shrink-0" onClick={() => avatarRef.current?.click()}>
                <img
                  src={profileData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/10"
                  alt=""
                />
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {compressingAvatar ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                </div>
              </div>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], "avatarUrl")} />
              <div>
                <p className="text-sm text-white font-medium">Click to upload a photo</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP · Max 10MB · Auto-compressed</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input className="lumina-input" value={profileData.displayName} onChange={e => setProfileData(p => ({ ...p, displayName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea className="lumina-input min-h-[100px]" value={profileData.bio} onChange={e => setProfileData(p => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input className="lumina-input" value={profileData.location} onChange={e => setProfileData(p => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input className="lumina-input" value={profileData.website} onChange={e => setProfileData(p => ({ ...p, website: e.target.value }))} />
              </div>
            </div>
            <Button onClick={handleProfileSave} disabled={updateProfile.isPending || compressingAvatar || compressingCover} className="btn-primary w-full">
              {updateProfile.isPending ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </div>

        <div className="lumina-card p-6 space-y-6">
          <h2 className="font-display text-lg font-semibold border-b border-white/10 pb-4">Security</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" className="lumina-input" value={passwordData.oldPassword} onChange={e => setPasswordData(p => ({ ...p, oldPassword: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" className="lumina-input" value={passwordData.newPassword} onChange={e => setPasswordData(p => ({ ...p, newPassword: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" className="lumina-input" value={passwordData.confirmPassword} onChange={e => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))} />
            </div>
            <Button
              onClick={handlePasswordSave}
              disabled={changePassword.isPending || !passwordData.oldPassword || !passwordData.newPassword}
              variant="outline"
              className="w-full"
            >
              {changePassword.isPending ? "Updating…" : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
