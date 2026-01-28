"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutList,
  LayoutGrid,
  Search,
  Plus,
  Loader2,
  ClipboardList,
  Sparkles,
  Bug,
  Lightbulb,
  FileText,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

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
  priority?: string;
}

interface StateInfo {
  name: string;
  color: string;
}

interface TypeInfo {
  name: string;
  icon: string;
}

interface Metadata {
  states: StateInfo[];
  types: TypeInfo[];
  assignees: Array<{ id: string; name: string }>;
}

const typeIcons: Record<string, React.ReactNode> = {
  Task: <ClipboardList className="h-4 w-4" />,
  Feature: <Sparkles className="h-4 w-4" />,
  Bug: <Bug className="h-4 w-4" />,
  Idea: <Lightbulb className="h-4 w-4" />,
  default: <FileText className="h-4 w-4" />,
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

export default function DashboardPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      try {
        const [ticketsRes, metadataRes] = await Promise.all([
          fetch("/api/tickets"),
          fetch("/api/metadata"),
        ]);

        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData);
        }

        if (metadataRes.ok) {
          const metadataData = await metadataRes.json();
          setMetadata(metadataData);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      searchQuery === "" ||
      ticket.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.idReadable.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState =
      stateFilter === "all" || ticket.state === stateFilter;

    const matchesType = typeFilter === "all" || ticket.type === typeFilter;

    return matchesSearch && matchesState && matchesType;
  });

  const getStateColor = (stateName?: string) => {
    if (!stateName || !metadata) return "bg-slate-500";
    const state = metadata.states.find((s) => s.name === stateName);
    return state ? stateColorMap[state.color] || "bg-slate-500" : "bg-slate-500";
  };

  // Group tickets by state for Kanban view
  const kanbanColumns = metadata?.states.map((state) => ({
    ...state,
    tickets: filteredTickets.filter((t) => t.state === state.name),
  })) || [];

  if (isLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header with filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100"
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-40 bg-slate-800/50 border-slate-700 text-slate-100">
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All States</SelectItem>
                {metadata?.states.map((state) => (
                  <SelectItem key={state.name} value={state.name}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 bg-slate-800/50 border-slate-700 text-slate-100">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">All Types</SelectItem>
                {metadata?.types.map((type) => (
                  <SelectItem key={type.name} value={type.name}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href="/tickets/new">
            <Button className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>

        {/* Tabs for List/Kanban view */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="bg-slate-800/50 border-slate-700">
            <TabsTrigger value="list" className="data-[state=active]:bg-slate-700">
              <LayoutList className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="kanban" className="data-[state=active]:bg-slate-700">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Kanban
            </TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="mt-6">
            <div className="bg-slate-800/30 rounded-lg border border-slate-700/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left p-4 text-sm font-medium text-slate-400">
                      Ticket
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">
                      Type
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">
                      State
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">
                      Assignee
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-slate-400">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No tickets found
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4">
                          <Link
                            href={`/tickets/${ticket.id}`}
                            className="block hover:text-indigo-400"
                          >
                            <span className="text-sm text-slate-500 mr-2">
                              {ticket.idReadable}
                            </span>
                            <span className="text-slate-200">
                              {ticket.summary}
                            </span>
                          </Link>
                        </td>
                        <td className="p-4">
                          <span className="flex items-center gap-2 text-sm text-slate-400">
                            {typeIcons[ticket.type || "default"] ||
                              typeIcons.default}
                            {ticket.type}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={cn(
                              "text-xs font-medium",
                              getStateColor(ticket.state)
                            )}
                          >
                            {ticket.state}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-slate-400">
                          {ticket.assignee?.name || "-"}
                        </td>
                        <td className="p-4 text-sm text-slate-500">
                          {ticket.updated
                            ? formatDate(ticket.updated)
                            : formatDate(ticket.created)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Kanban View */}
          <TabsContent value="kanban" className="mt-6">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {kanbanColumns.map((column) => (
                <div
                  key={column.name}
                  className="flex-shrink-0 w-72 bg-slate-800/30 rounded-lg border border-slate-700/50"
                >
                  <div className="p-3 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          stateColorMap[column.color] || "bg-slate-500"
                        )}
                      />
                      <span className="text-sm font-medium text-slate-200">
                        {column.name}
                      </span>
                      <span className="text-xs text-slate-500 ml-auto">
                        {column.tickets.length}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                    {column.tickets.map((ticket) => (
                      <Link
                        key={ticket.id}
                        href={`/tickets/${ticket.id}`}
                        className="block p-3 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-indigo-500/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-slate-400">
                            {typeIcons[ticket.type || "default"] ||
                              typeIcons.default}
                          </span>
                          <span className="text-xs text-slate-500">
                            {ticket.idReadable}
                          </span>
                        </div>
                        <p className="text-sm text-slate-200 line-clamp-2">
                          {ticket.summary}
                        </p>
                        {ticket.assignee && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                              <span className="text-white text-xs">
                                {ticket.assignee.name.charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">
                              {ticket.assignee.name}
                            </span>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
