import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, useUpdateProfile, useChangePassword } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: user } = useGetMe();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const [profileData, setProfileData] = useState({
    displayName: "",
    bio: "",
    website: "",
    location: "",
    avatarUrl: "",
    coverUrl: ""
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

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

  const handleProfileSave = () => {
    updateProfile.mutate({ data: profileData }, {
      onSuccess: () => toast.success("Profile updated successfully")
    });
  };

  const handlePasswordSave = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    changePassword.mutate({ 
      data: { oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword } 
    }, {
      onSuccess: () => {
        toast.success("Password changed successfully");
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      },
      onError: (err: any) => toast.error(err?.error || "Failed to change password")
    });
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 w-full max-w-2xl mx-auto space-y-8">
        <h1 className="font-display text-2xl font-bold text-white mb-6">Settings</h1>

        <div className="lumina-card p-6 space-y-6">
          <h2 className="font-display text-lg font-semibold border-b border-white/10 pb-4">Edit Profile</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input 
                className="lumina-input" 
                value={profileData.displayName}
                onChange={e => setProfileData({...profileData, displayName: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea 
                className="lumina-input min-h-[100px]" 
                value={profileData.bio}
                onChange={e => setProfileData({...profileData, bio: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input 
                  className="lumina-input" 
                  value={profileData.location}
                  onChange={e => setProfileData({...profileData, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input 
                  className="lumina-input" 
                  value={profileData.website}
                  onChange={e => setProfileData({...profileData, website: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Avatar URL</Label>
              <Input 
                className="lumina-input" 
                value={profileData.avatarUrl}
                onChange={e => setProfileData({...profileData, avatarUrl: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Cover Photo URL</Label>
              <Input 
                className="lumina-input" 
                value={profileData.coverUrl}
                onChange={e => setProfileData({...profileData, coverUrl: e.target.value})}
              />
            </div>

            <Button onClick={handleProfileSave} disabled={updateProfile.isPending} className="btn-primary w-full">
              {updateProfile.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>

        <div className="lumina-card p-6 space-y-6">
          <h2 className="font-display text-lg font-semibold border-b border-white/10 pb-4">Security</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input 
                type="password"
                className="lumina-input" 
                value={passwordData.oldPassword}
                onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password"
                className="lumina-input" 
                value={passwordData.newPassword}
                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input 
                type="password"
                className="lumina-input" 
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              />
            </div>

            <Button onClick={handlePasswordSave} disabled={changePassword.isPending || !passwordData.oldPassword} variant="outline" className="w-full">
              {changePassword.isPending ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
