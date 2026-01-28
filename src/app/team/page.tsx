"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, UserPlus, Trash2, Clock, Mail } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  createdBy: {
    name: string;
  };
}

export default function TeamPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const fetchTeam = async () => {
    try {
      const response = await fetch("/api/team");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setInvitations(data.pendingInvitations);
      }
    } catch (error) {
      console.error("Failed to fetch team:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    setIsInviting(true);

    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });

      if (response.ok) {
        toast({
          title: "Invitation Sent",
          description: `An invitation has been sent to ${inviteEmail}`,
        });
        setInviteEmail("");
        setIsInviteOpen(false);
        fetchTeam();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to send invitation",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/team?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "User Removed",
          description: "The user has been removed from the team.",
        });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to remove user",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/team?invitationId=${invitationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Invitation Cancelled",
          description: "The invitation has been cancelled.",
        });
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      } else {
        toast({
          title: "Error",
          description: "Failed to cancel invitation",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-500";
      case "ADMIN":
        return "bg-indigo-500";
      default:
        return "bg-slate-500";
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Team">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Team">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-200">Team Members</h2>
            <p className="text-sm text-slate-400">
              Manage your team and send invitations
            </p>
          </div>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Invite Team Member</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Send an invitation email to a new team member.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-slate-100"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsInviteOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Team Members */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-200">Members ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-200">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleBadgeVariant(user.role)}>
                      {user.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-400"
                      onClick={() => handleRemoveUser(user.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-slate-200">
                Pending Invitations ({invitations.length})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Invitations that haven&apos;t been accepted yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">{invitation.email}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>Invited by {invitation.createdBy.name}</span>
                          <span>&bull;</span>
                          <Clock className="h-3 w-3" />
                          <span>Expires {formatDate(invitation.expiresAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-red-400"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
