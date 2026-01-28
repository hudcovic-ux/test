"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Save, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

interface FieldConfig {
  id: string;
  fieldName: string;
  visible: boolean;
  editable: boolean;
  displayOrder: number;
}

interface Organization {
  id: string;
  name: string;
  youtrackClient: string;
  createdAt: string;
  users: User[];
  fieldConfigs: FieldConfig[];
}

const AVAILABLE_FIELDS = [
  { name: "type", label: "Type", description: "Ticket type (Task, Feature, Bug, Idea)" },
  { name: "state", label: "State", description: "Workflow state" },
  { name: "assignee", label: "Assignee", description: "Assigned team member" },
  { name: "estimation", label: "Estimation", description: "Time estimation" },
  { name: "dueDate", label: "Due Date", description: "Target completion date" },
  { name: "priority", label: "Priority", description: "Ticket priority level" },
];

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [name, setName] = useState("");
  const [youtrackClient, setYoutrackClient] = useState("");
  const [fieldConfigs, setFieldConfigs] = useState<
    Array<{ fieldName: string; visible: boolean; editable: boolean; displayOrder: number }>
  >([]);

  useEffect(() => {
    async function fetchOrganization() {
      try {
        const response = await fetch(`/api/admin/organizations/${id}`);
        if (response.ok) {
          const data = await response.json();
          setOrganization(data);
          setName(data.name);
          setYoutrackClient(data.youtrackClient);

          // Initialize field configs with existing or defaults
          const configs = AVAILABLE_FIELDS.map((field, index) => {
            const existing = data.fieldConfigs.find(
              (fc: FieldConfig) => fc.fieldName === field.name
            );
            return {
              fieldName: field.name,
              visible: existing?.visible ?? true,
              editable: existing?.editable ?? false,
              displayOrder: existing?.displayOrder ?? index,
            };
          });
          setFieldConfigs(configs);
        }
      } catch (error) {
        console.error("Failed to fetch organization:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrganization();
  }, [id]);

  const handleSaveBasicInfo = async () => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, youtrackClient }),
      });

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Organization details have been updated.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveFieldConfigs = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/field-configs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: id,
          configs: fieldConfigs,
        }),
      });

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Field configurations have been updated.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save field configurations",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save field configurations",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateFieldConfig = (
    fieldName: string,
    key: "visible" | "editable",
    value: boolean
  ) => {
    setFieldConfigs((prev) =>
      prev.map((fc) =>
        fc.fieldName === fieldName
          ? { ...fc, [key]: value, ...(key === "visible" && !value ? { editable: false } : {}) }
          : fc
      )
    );
  };

  if (isLoading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  if (!organization) {
    return (
      <AppLayout title="Not Found">
        <div className="text-center py-12">
          <p className="text-slate-400">Organization not found.</p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/organizations")}
            className="mt-4"
          >
            Back to Organizations
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={organization.name}>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/organizations")}
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Organizations
        </Button>

        {/* Basic Info */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-200">Organization Details</CardTitle>
            <CardDescription className="text-slate-400">
              Basic information about this organization
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
              <Label htmlFor="youtrackClient" className="text-slate-200">
                YouTrack Client Value
              </Label>
              <Input
                id="youtrackClient"
                value={youtrackClient}
                onChange={(e) => setYoutrackClient(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-slate-100"
              />
              <p className="text-xs text-slate-500">
                Must match the Client field value in YouTrack
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Created</Label>
              <p className="text-sm text-slate-400">
                {formatDate(organization.createdAt)}
              </p>
            </div>

            <Button
              onClick={handleSaveBasicInfo}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Field Configuration */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-200">Field Configuration</CardTitle>
            <CardDescription className="text-slate-400">
              Control which fields are visible and editable for this organization&apos;s
              users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {AVAILABLE_FIELDS.map((field) => {
              const config = fieldConfigs.find((fc) => fc.fieldName === field.name);
              return (
                <div
                  key={field.name}
                  className="flex items-center justify-between py-3 border-b border-slate-700/30 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-200">{field.label}</p>
                    <p className="text-xs text-slate-500">{field.description}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config?.visible ?? true}
                        onCheckedChange={(checked) =>
                          updateFieldConfig(field.name, "visible", checked)
                        }
                      />
                      <Label className="text-sm text-slate-400">Visible</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={config?.editable ?? false}
                        disabled={!config?.visible}
                        onCheckedChange={(checked) =>
                          updateFieldConfig(field.name, "editable", checked)
                        }
                      />
                      <Label className="text-sm text-slate-400">Editable</Label>
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              onClick={handleSaveFieldConfigs}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Field Configuration
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Users */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-200 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Users ({organization.users.length})
            </CardTitle>
            <CardDescription className="text-slate-400">
              Members of this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {organization.users.length === 0 ? (
              <p className="text-slate-500 text-sm">No users in this organization</p>
            ) : (
              <div className="space-y-3">
                {organization.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-900/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                        <span className="text-white text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                    <Badge
                      className={
                        user.role === "SUPER_ADMIN"
                          ? "bg-red-500"
                          : user.role === "ADMIN"
                          ? "bg-indigo-500"
                          : "bg-slate-500"
                      }
                    >
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
