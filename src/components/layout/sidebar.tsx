"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Ticket,
  User,
  Users,
  Settings,
  LogOut,
  Building2,
  Shield,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Ticket", href: "/tickets/new", icon: Ticket },
];

const userNavigation = [
  { name: "Profile", href: "/profile", icon: User },
  { name: "Team", href: "/team", icon: Users, roles: ["ADMIN", "SUPER_ADMIN"] },
];

const adminNavigation = [
  { name: "Přehled", href: "/admin", icon: Shield },
  { name: "Organizace", href: "/admin/organizations", icon: Building2 },
  { name: "Uživatelé", href: "/admin/users", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  return (
    <div className="flex flex-col h-full w-64 bg-slate-900 border-r border-slate-800">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-slate-800">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Snadnee"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-semibold bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 bg-clip-text text-transparent">
            SCS
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-800 text-indigo-400"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        <Separator className="my-4 bg-slate-800" />

        <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Account
        </p>

        {userNavigation
          .filter((item) => !item.roles || (userRole && item.roles.includes(userRole)))
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-indigo-400"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}

        {userRole === "SUPER_ADMIN" && (
          <>
            <Separator className="my-4 bg-slate-800" />

            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Admin
            </p>

            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-800 text-indigo-400"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
            <span className="text-white font-medium text-sm">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {session?.user?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {session?.user?.organizationName}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
