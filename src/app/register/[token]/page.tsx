"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";

interface InvitationData {
  email: string;
  organizationName: string;
  invitedBy: string;
  expiresAt: string;
}

export default function RegisterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(`/api/register?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setValidationError(data.error || "Invalid invitation");
        } else {
          setInvitation(data);
        }
      } catch {
        setValidationError("Failed to validate invitation");
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Failed to create account");
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setFormError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-slate-100 mb-2">
                Invalid Invitation
              </h2>
              <p className="text-slate-400 mb-6">{validationError}</p>
              <Button
                onClick={() => router.push("/login")}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            CCS Portal
          </h1>
          <p className="text-slate-400 mt-2">Custom Client Space</p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-slate-100">Create Account</CardTitle>
            <CardDescription className="text-slate-400">
              You&apos;ve been invited to join{" "}
              <span className="text-indigo-400">{invitation?.organizationName}</span> by{" "}
              <span className="text-slate-300">{invitation?.invitedBy}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={invitation?.email || ""}
                  disabled
                  className="bg-slate-900/30 border-slate-700 text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
