"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Toaster } from "@/components/ui/toaster";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <SessionProvider>
      <div className="flex h-screen bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title={title} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
      <Toaster />
    </SessionProvider>
  );
}
