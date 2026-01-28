"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TypeInfo {
  name: string;
  icon: string;
}

interface Metadata {
  types: TypeInfo[];
  assignees: Array<{ id: string; name: string }>;
}

export default function NewTicketPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("");
  const [assignee, setAssignee] = useState<string>("");

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const response = await fetch("/api/metadata");
        if (response.ok) {
          const data = await response.json();
          setMetadata(data);
          if (data.types.length > 0) {
            setType(data.types[0].name);
          }
        }
      } catch (error) {
        console.error("Failed to fetch metadata:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetadata();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      toast({
        title: "Error",
        description: "Summary is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          description: description || undefined,
          type: type || undefined,
          assignee: assignee || undefined,
        }),
      });

      if (response.ok) {
        const ticket = await response.json();
        toast({
          title: "Ticket Created",
          description: `${ticket.idReadable} has been created successfully.`,
        });
        router.push(`/tickets/${ticket.id}`);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create ticket",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="New Ticket">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="New Ticket">
      <div className="max-w-2xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-200">Create New Ticket</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="summary" className="text-slate-200">
                  Summary <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="summary"
                  placeholder="Brief description of the issue or request"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-slate-100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-200">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description, steps to reproduce, expected behavior..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-slate-100 min-h-[150px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-slate-200">
                    Type
                  </Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {metadata?.types.map((t) => (
                        <SelectItem key={t.name} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignee" className="text-slate-200">
                    Assignee
                  </Label>
                  <Select value={assignee} onValueChange={setAssignee}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="">Unassigned</SelectItem>
                      {metadata?.assignees.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Ticket"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
