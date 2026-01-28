"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Ticket, TrendingUp, Loader2 } from "lucide-react";

interface AdminStats {
  organizationsCount: number;
  usersCount: number;
  ticketsCount: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    organizationName: string;
    createdAt: string;
  }>;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <AppLayout title="Admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Admin Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-400">Správa systému Snadnee Client Space</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/organizations">
            <Card className="bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Organizace
                </CardTitle>
                <Building2 className="h-5 w-5 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">
                  {stats?.organizationsCount || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Registrovaných organizací
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/users">
            <Card className="bg-slate-800/30 border-slate-700/50 hover:border-indigo-500/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  Uživatelé
                </CardTitle>
                <Users className="h-5 w-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-100">
                  {stats?.usersCount || 0}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Aktivních uživatelů
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                Systém
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-100">
                Online
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Stav systému
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-slate-200">Rychlé akce</CardTitle>
              <CardDescription className="text-slate-400">
                Běžné administrativní úkony
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/admin/organizations"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors"
              >
                <Building2 className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="font-medium text-slate-200">Správa organizací</p>
                  <p className="text-sm text-slate-500">Vytvořit, upravit nebo smazat organizace</p>
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors"
              >
                <Users className="h-5 w-5 text-green-400" />
                <div>
                  <p className="font-medium text-slate-200">Správa uživatelů</p>
                  <p className="text-sm text-slate-500">Vytvořit, upravit nebo smazat uživatele</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-slate-200">Poslední uživatelé</CardTitle>
              <CardDescription className="text-slate-400">
                Nedávno registrovaní uživatelé
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentUsers && stats.recentUsers.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/30"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                        <span className="text-white text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {user.organizationName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-sm">Žádní noví uživatelé</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
