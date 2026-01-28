"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Building2, Users, Settings, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface Organization {
  id: string;
  name: string;
  youtrackClient: string;
  createdAt: string;
  _count: {
    users: number;
  };
}

export default function AdminOrganizationsPage() {
  const { toast } = useToast();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newName, setNewName] = useState("");
  const [newYoutrackClient, setNewYoutrackClient] = useState("");

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/admin/organizations");
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim() || !newYoutrackClient.trim()) return;

    setIsCreating(true);

    try {
      const response = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          youtrackClient: newYoutrackClient,
        }),
      });

      if (response.ok) {
        toast({
          title: "Organization Created",
          description: `${newName} has been created successfully.`,
        });
        setNewName("");
        setNewYoutrackClient("");
        setIsCreateOpen(false);
        fetchOrganizations();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create organization",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;

    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Organization Deleted",
          description: `${name} has been deleted.`,
        });
        setOrganizations((prev) => prev.filter((o) => o.id !== id));
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to delete organization",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Organizations">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Organizations">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-200">All Organizations</h2>
            <p className="text-sm text-slate-400">
              Manage client organizations and their settings
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600">
                <Plus className="h-4 w-4 mr-2" />
                New Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-slate-200">Create Organization</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Add a new client organization to CCS.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-200">
                    Organization Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Acme Inc."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-slate-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtrackClient" className="text-slate-200">
                    YouTrack Client Value
                  </Label>
                  <Input
                    id="youtrackClient"
                    placeholder="ACME"
                    value={newYoutrackClient}
                    onChange={(e) => setNewYoutrackClient(e.target.value)}
                    className="bg-slate-900/50 border-slate-700 text-slate-100"
                  />
                  <p className="text-xs text-slate-500">
                    This must match the Client custom field value in YouTrack
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={isCreating || !newName.trim() || !newYoutrackClient.trim()}
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Organization"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Organizations Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {organizations.length === 0 ? (
            <Card className="col-span-full bg-slate-800/30 border-slate-700/50">
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No organizations yet</p>
                <p className="text-sm text-slate-500 mt-1">
                  Create your first organization to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            organizations.map((org) => (
              <Card
                key={org.id}
                className="bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/50 transition-colors"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg text-slate-200">{org.name}</CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      Client: <code className="text-indigo-400">{org.youtrackClient}</code>
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/admin/organizations/${org.id}`}>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-400 hover:text-red-400"
                      onClick={() => handleDelete(org.id, org.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {org._count.users} users
                    </div>
                    <span className="text-slate-600">|</span>
                    <span>Created {formatDate(org.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
