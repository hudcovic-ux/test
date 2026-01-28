"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Profile {
  id: string;
  email: string;
  name: string;
  role: string;
  notifyEmail: boolean;
  notifyInApp: boolean;
  notifyOnComment: boolean;
  notifyOnState: boolean;
  notifyOnAssignee: boolean;
  organization: {
    id: string;
    name: string;
  };
}

export default function ProfilePage() {
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notification preferences
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [notifyOnComment, setNotifyOnComment] = useState(true);
  const [notifyOnState, setNotifyOnState] = useState(true);
  const [notifyOnAssignee, setNotifyOnAssignee] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
          setName(data.name);
          setEmail(data.email);
          setNotifyEmail(data.notifyEmail);
          setNotifyInApp(data.notifyInApp);
          setNotifyOnComment(data.notifyOnComment);
          setNotifyOnState(data.notifyOnState);
          setNotifyOnAssignee(data.notifyOnAssignee);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);

    try {
      const updates: Record<string, unknown> = {};

      if (name !== profile?.name) updates.name = name;
      if (email !== profile?.email) updates.email = email;

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          toast({
            title: "Error",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setIsSaving(false);
          return;
        }
        updates.currentPassword = currentPassword;
        updates.newPassword = newPassword;
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => (prev ? { ...prev, ...data } : null));
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifyEmail,
          notifyInApp,
          notifyOnComment,
          notifyOnState,
          notifyOnAssignee,
        }),
      });

      if (response.ok) {
        toast({
          title: "Preferences Saved",
          description: "Your notification preferences have been updated.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save preferences",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Profile">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Information */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-200">Profile Information</CardTitle>
            <CardDescription className="text-slate-400">
              Update your account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-200">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Organization</Label>
              <Input
                value={profile?.organization.name || ""}
                disabled
                className="bg-slate-900/30 border-slate-700 text-slate-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Role</Label>
              <Input
                value={profile?.role || ""}
                disabled
                className="bg-slate-900/30 border-slate-700 text-slate-400"
              />
            </div>

            <Separator className="bg-slate-700/50 my-6" />

            <h3 className="text-sm font-medium text-slate-200">Change Password</h3>

            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-slate-200">
                Current Password
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-slate-200">
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-slate-100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-slate-100"
                />
              </div>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-200">Notification Preferences</CardTitle>
            <CardDescription className="text-slate-400">
              Choose how you want to be notified
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">Channels</h4>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200">Email Notifications</Label>
                  <p className="text-xs text-slate-500">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={notifyEmail}
                  onCheckedChange={setNotifyEmail}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200">In-App Notifications</Label>
                  <p className="text-xs text-slate-500">
                    Show notifications in the app
                  </p>
                </div>
                <Switch
                  checked={notifyInApp}
                  onCheckedChange={setNotifyInApp}
                />
              </div>
            </div>

            <Separator className="bg-slate-700/50" />

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-300">Event Types</h4>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200">New Comments</Label>
                  <p className="text-xs text-slate-500">
                    When someone adds a comment to a ticket
                  </p>
                </div>
                <Switch
                  checked={notifyOnComment}
                  onCheckedChange={setNotifyOnComment}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200">State Changes</Label>
                  <p className="text-xs text-slate-500">
                    When a ticket state is changed
                  </p>
                </div>
                <Switch
                  checked={notifyOnState}
                  onCheckedChange={setNotifyOnState}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-slate-200">Assignee Changes</Label>
                  <p className="text-xs text-slate-500">
                    When a ticket is assigned or reassigned
                  </p>
                </div>
                <Switch
                  checked={notifyOnAssignee}
                  onCheckedChange={setNotifyOnAssignee}
                />
              </div>
            </div>

            <Button
              onClick={handleSaveNotifications}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
