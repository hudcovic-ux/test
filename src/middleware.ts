import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET });
  const isLoggedIn = !!token;

  const { pathname } = req.nextUrl;

  const isOnDashboard = pathname.startsWith("/dashboard");
  const isOnTickets = pathname.startsWith("/tickets");
  const isOnProfile = pathname.startsWith("/profile");
  const isOnTeam = pathname.startsWith("/team");
  const isOnAdmin = pathname.startsWith("/admin");
  const isOnLogin = pathname.startsWith("/login");
  const isOnRegister = pathname.startsWith("/register");
  const isOnApi = pathname.startsWith("/api");

  // Allow API routes, static files, and logo
  if (isOnApi || pathname.startsWith("/_next") || pathname.endsWith(".svg") || pathname.endsWith(".ico")) {
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
  if (isOnAdmin && token?.role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
