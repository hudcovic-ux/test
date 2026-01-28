"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Send,
  Pencil,
  Check,
  X,
  ClipboardList,
  Sparkles,
  Bug,
  Lightbulb,
  FileText,
  Calendar,
  Clock,
  User,
} from "lucide-react";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface Ticket {
  id: string;
  idReadable: string;
  summary: string;
  description?: string;
  created: string;
  updated?: string;
  type?: string;
  state?: string;
  assignee?: {
    id: string;
    name: string;
  };
  estimation?: string;
  dueDate?: string;
  priority?: string;
  reporter?: {
    id: string;
    name: string;
  };
}

interface Comment {
  id: string;
  text: string;
  created: string;
  author: {
    id: string;
    name: string;
  };
}

interface StateInfo {
  name: string;
  color: string;
}

interface TypeInfo {
  name: string;
  icon: string;
}

interface FieldConfig {
  fieldName: string;
  visible: boolean;
  editable: boolean;
}

interface Metadata {
  states: StateInfo[];
  types: TypeInfo[];
  assignees: Array<{ id: string; name: string }>;
  fieldConfigs: FieldConfig[];
}

const typeIcons: Record<string, React.ReactNode> = {
  Task: <ClipboardList className="h-5 w-5" />,
  Feature: <Sparkles className="h-5 w-5" />,
  Bug: <Bug className="h-5 w-5" />,
  Idea: <Lightbulb className="h-5 w-5" />,
  default: <FileText className="h-5 w-5" />,
};

const stateColorMap: Record<string, string> = {
  pink: "bg-pink-500",
  sky: "bg-sky-400",
  orange: "bg-orange-500",
  green: "bg-green-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  yellow: "bg-yellow-500 text-slate-900",
  cyan: "bg-cyan-400 text-slate-900",
  indigo: "bg-indigo-500",
  slate: "bg-slate-500",
  red: "bg-red-500",
};

export default function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Inline editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ticketRes, commentsRes, metadataRes] = await Promise.all([
          fetch(`/api/tickets/${id}`),
          fetch(`/api/tickets/${id}/comments`),
          fetch("/api/metadata"),
        ]);

        if (ticketRes.ok) {
          setTicket(await ticketRes.json());
        }
        if (commentsRes.ok) {
          setComments(await commentsRes.json());
        }
        if (metadataRes.ok) {
          setMetadata(await metadataRes.json());
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const isFieldEditable = (fieldName: string) => {
    if (!metadata) return false;
    const config = metadata.fieldConfigs.find((fc) => fc.fieldName === fieldName);
    return config?.editable ?? false;
  };

  const isFieldVisible = (fieldName: string) => {
    if (!metadata) return true;
    const config = metadata.fieldConfigs.find((fc) => fc.fieldName === fieldName);
    return config?.visible ?? true;
  };

  const startEditing = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const saveField = async (field: string) => {
    if (!ticket) return;
    setIsSaving(true);

    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: editValue }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicket(updatedTicket);
        toast({
          title: "Updated",
          description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update ticket",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setEditingField(null);
      setEditValue("");
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments((prev) => [...prev, comment]);
        setNewComment("");
        toast({
          title: "Comment added",
          description: "Your comment has been added successfully.",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const getStateColor = (stateName?: string) => {
    if (!stateName || !metadata) return "bg-slate-500";
    const state = metadata.states.find((s) => s.name === stateName);
    return state ? stateColorMap[state.color] || "bg-slate-500" : "bg-slate-500";
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

  if (!ticket) {
    return (
      <AppLayout title="Ticket Not Found">
        <div className="text-center py-12">
          <p className="text-slate-400">Ticket not found or you don&apos;t have access.</p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mt-4"
          >
            Back to Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={ticket.idReadable}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <span className="text-slate-400">
                    {typeIcons[ticket.type || "default"]}
                  </span>
                  <div className="flex-1">
                    {editingField === "summary" ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="bg-slate-900/50 border-slate-700"
                          autoFocus
                        />
                        <Button
                          size="icon"
                          onClick={() => saveField("summary")}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="group flex items-center gap-2 cursor-pointer"
                        onClick={() => startEditing("summary", ticket.summary)}
                      >
                        <h1 className="text-xl font-semibold text-slate-100">
                          {ticket.summary}
                        </h1>
                        <Pencil className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                    <p className="text-sm text-slate-500 mt-1">
                      {ticket.idReadable}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-200 text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                {editingField === "description" ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-slate-900/50 border-slate-700 min-h-[150px]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button onClick={() => saveField("description")} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Save
                      </Button>
                      <Button variant="ghost" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="group cursor-pointer"
                    onClick={() => startEditing("description", ticket.description || "")}
                  >
                    {ticket.description ? (
                      <p className="text-slate-300 whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    ) : (
                      <p className="text-slate-500 italic">No description provided</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-sm text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Pencil className="h-3 w-3" />
                      Click to edit
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comments */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-slate-200 text-base">
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-slate-500 text-sm">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">
                          {comment.author.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-200">
                            {comment.author.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDateTime(comment.created)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                <Separator className="bg-slate-700/50" />

                <form onSubmit={handleSubmitComment} className="flex gap-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="bg-slate-900/50 border-slate-700 min-h-[80px]"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="self-end"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card className="bg-slate-800/30 border-slate-700/50">
              <CardContent className="pt-6 space-y-4">
                {/* State */}
                {isFieldVisible("state") && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">
                      State
                    </label>
                    {isFieldEditable("state") ? (
                      <Select
                        value={ticket.state || ""}
                        onValueChange={async (value) => {
                          setEditValue(value);
                          await saveField("state");
                        }}
                      >
                        <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-700">
                          <Badge className={cn("text-xs", getStateColor(ticket.state))}>
                            {ticket.state || "Unknown"}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {metadata?.states.map((state) => (
                            <SelectItem key={state.name} value={state.name}>
                              <Badge
                                className={cn("text-xs", stateColorMap[state.color])}
                              >
                                {state.name}
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={cn("mt-1 text-xs", getStateColor(ticket.state))}>
                        {ticket.state || "Unknown"}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Type */}
                {isFieldVisible("type") && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">
                      Type
                    </label>
                    {isFieldEditable("type") ? (
                      <Select
                        value={ticket.type || ""}
                        onValueChange={async (value) => {
                          setEditValue(value);
                          const response = await fetch(`/api/tickets/${id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: value }),
                          });
                          if (response.ok) {
                            const updated = await response.json();
                            setTicket(updated);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {metadata?.types.map((type) => (
                            <SelectItem key={type.name} value={type.name}>
                              <span className="flex items-center gap-2">
                                {typeIcons[type.name]}
                                {type.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 mt-1 text-slate-200">
                        {typeIcons[ticket.type || "default"]}
                        {ticket.type || "Unknown"}
                      </div>
                    )}
                  </div>
                )}

                {/* Assignee */}
                {isFieldVisible("assignee") && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">
                      Assignee
                    </label>
                    {isFieldEditable("assignee") ? (
                      <Select
                        value={ticket.assignee?.id || ""}
                        onValueChange={async (value) => {
                          const response = await fetch(`/api/tickets/${id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ assignee: value }),
                          });
                          if (response.ok) {
                            const updated = await response.json();
                            setTicket(updated);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1 bg-slate-900/50 border-slate-700">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {metadata?.assignees.map((assignee) => (
                            <SelectItem key={assignee.id} value={assignee.id}>
                              {assignee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 mt-1 text-slate-200">
                        <User className="h-4 w-4 text-slate-500" />
                        {ticket.assignee?.name || "Unassigned"}
                      </div>
                    )}
                  </div>
                )}

                <Separator className="bg-slate-700/50" />

                {/* Estimation */}
                {isFieldVisible("estimation") && ticket.estimation && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">
                      Estimation
                    </label>
                    <div className="flex items-center gap-2 mt-1 text-slate-200">
                      <Clock className="h-4 w-4 text-slate-500" />
                      {ticket.estimation}
                    </div>
                  </div>
                )}

                {/* Due Date */}
                {isFieldVisible("dueDate") && ticket.dueDate && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">
                      Due Date
                    </label>
                    <div className="flex items-center gap-2 mt-1 text-slate-200">
                      <Calendar className="h-4 w-4 text-slate-500" />
                      {formatDate(ticket.dueDate)}
                    </div>
                  </div>
                )}

                <Separator className="bg-slate-700/50" />

                {/* Created */}
                <div>
                  <label className="text-xs text-slate-500 uppercase tracking-wider">
                    Created
                  </label>
                  <p className="text-sm text-slate-300 mt-1">
                    {formatDateTime(ticket.created)}
                  </p>
                  {ticket.reporter && (
                    <p className="text-xs text-slate-500">by {ticket.reporter.name}</p>
                  )}
                </div>

                {/* Updated */}
                {ticket.updated && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase tracking-wider">
                      Last Updated
                    </label>
                    <p className="text-sm text-slate-300 mt-1">
                      {formatDateTime(ticket.updated)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
