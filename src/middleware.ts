import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnTickets = req.nextUrl.pathname.startsWith("/tickets");
  const isOnProfile = req.nextUrl.pathname.startsWith("/profile");
  const isOnTeam = req.nextUrl.pathname.startsWith("/team");
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");
  const isOnLogin = req.nextUrl.pathname.startsWith("/login");
  const isOnRegister = req.nextUrl.pathname.startsWith("/register");
  const isOnApi = req.nextUrl.pathname.startsWith("/api");

  // Allow API routes to handle their own auth
  if (isOnApi) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login/register pages
  if (isLoggedIn && (isOnLogin || isOnRegister)) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Protect dashboard, tickets, profile, team, and admin routes
  if (!isLoggedIn && (isOnDashboard || isOnTickets || isOnProfile || isOnTeam || isOnAdmin)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes require SUPER_ADMIN role
  if (isOnAdmin && req.auth?.user?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
