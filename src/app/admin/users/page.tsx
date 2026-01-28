"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Pencil, Trash2, Search, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
    role: "USER",
    organizationId: "",
  });

  // Delete dialog
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, orgsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/organizations"),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (orgsRes.ok) {
        const orgsData = await orgsRes.json();
        setOrganizations(orgsData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.organization.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateDialog = () => {
    setEditingUser(null);
    setFormData({
      email: "",
      name: "",
      password: "",
      role: "USER",
      organizationId: organizations[0]?.id || "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: "",
      role: user.role,
      organizationId: user.organizationId,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.email || !formData.name || !formData.organizationId) {
      toast({
        title: "Chyba",
        description: "Vyplňte všechna povinná pole",
        variant: "destructive",
      });
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "Chyba",
        description: "Heslo je povinné pro nového uživatele",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const url = editingUser
        ? `/api/admin/users/${editingUser.id}`
        : "/api/admin/users";
      const method = editingUser ? "PATCH" : "POST";

      const body: Record<string, string> = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        organizationId: formData.organizationId,
      };

      if (formData.password) {
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: editingUser ? "Uživatel upraven" : "Uživatel vytvořen",
          description: editingUser
            ? "Změny byly uloženy."
            : "Nový uživatel byl úspěšně vytvořen.",
        });
        setIsDialogOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Chyba",
          description: error.error || "Nepodařilo se uložit uživatele",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit uživatele",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Uživatel smazán",
          description: "Uživatel byl úspěšně odstraněn.",
        });
        setDeleteUser(null);
        setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
      } else {
        const error = await response.json();
        toast({
          title: "Chyba",
          description: error.error || "Nepodařilo se smazat uživatele",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat uživatele",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-red-500";
      case "ADMIN":
        return "bg-indigo-500";
      default:
        return "bg-slate-500";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Admin";
      default:
        return "Uživatel";
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Správa uživatelů">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Správa uživatelů">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Správa uživatelů</h1>
            <p className="text-slate-400">Vytvářejte a spravujte uživatele systému</p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Nový uživatel
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Hledat uživatele..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-slate-100"
          />
        </div>

        {/* Users Table */}
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-200">
              Uživatelé ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left p-3 text-sm font-medium text-slate-400">
                      Uživatel
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-slate-400">
                      Organizace
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-slate-400">
                      Role
                    </th>
                    <th className="text-left p-3 text-sm font-medium text-slate-400">
                      Vytvořen
                    </th>
                    <th className="text-right p-3 text-sm font-medium text-slate-400">
                      Akce
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Žádní uživatelé nenalezeni
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-slate-700/30 hover:bg-slate-800/30"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                              <span className="text-white text-sm">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-200">
                                {user.name}
                              </p>
                              <p className="text-sm text-slate-500">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">
                          {user.organization.name}
                        </td>
                        <td className="p-3">
                          <Badge className={getRoleBadgeVariant(user.role)}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-400">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                              className="text-slate-400 hover:text-slate-200"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteUser(user)}
                              className="text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-200">
                {editingUser ? "Upravit uživatele" : "Nový uživatel"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {editingUser
                  ? "Upravte údaje uživatele"
                  : "Vytvořte nového uživatele v systému"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">
                  Jméno *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="bg-slate-900/50 border-slate-700 text-slate-100"
                  placeholder="Jan Novák"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="bg-slate-900/50 border-slate-700 text-slate-100"
                  placeholder="jan@firma.cz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Heslo {editingUser ? "(ponechte prázdné pro zachování)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="bg-slate-900/50 border-slate-700 text-slate-100"
                  placeholder="Minimálně 8 znaků"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization" className="text-slate-200">
                  Organizace *
                </Label>
                <Select
                  value={formData.organizationId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organizationId: value })
                  }
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100">
                    <SelectValue placeholder="Vyberte organizaci" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-200">
                  Role *
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="USER">Uživatel</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Zrušit
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ukládám...
                  </>
                ) : editingUser ? (
                  "Uložit změny"
                ) : (
                  "Vytvořit uživatele"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
          <AlertDialogContent className="bg-slate-800 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-slate-200">
                Smazat uživatele?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Opravdu chcete smazat uživatele{" "}
                <span className="font-medium text-slate-300">
                  {deleteUser?.name}
                </span>
                ? Tato akce je nevratná.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
                Zrušit
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mažu...
                  </>
                ) : (
                  "Smazat"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
