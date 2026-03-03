import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ManagedUser {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<string>("attendant");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await supabase.functions.invoke("admin-manage-users", {
      body: { action: "list" },
    });

    if (res.data?.users) {
      setUsers(res.data.users);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setUsername("");
    setDisplayName("");
    setRole("attendant");
    setEditingUser(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (u: ManagedUser) => {
    setEditingUser(u);
    setUsername(u.username);
    setDisplayName(u.display_name);
    setRole(u.role);
    setEmail("");
    setPassword("");
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (editingUser) {
        const body: Record<string, string> = { action: "update", user_id: editingUser.user_id };
        if (username && username !== editingUser.username) body.username = username;
        if (displayName && displayName !== editingUser.display_name) body.display_name = displayName;
        if (role !== editingUser.role) body.role = role;
        if (password) body.password = password;
        if (email) body.email = email;

        const res = await supabase.functions.invoke("admin-manage-users", { body });
        if (res.data?.error) throw new Error(res.data.error);
        toast.success("User updated successfully");
      } else {
        if (!email || !password || !username || !displayName) {
          toast.error("Please fill all fields");
          setSubmitting(false);
          return;
        }
        const res = await supabase.functions.invoke("admin-manage-users", {
          body: { action: "create", email, password, username, display_name: displayName, role },
        });
        if (res.data?.error) throw new Error(res.data.error);
        toast.success("User created successfully");
      }
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Operation failed");
    }
    setSubmitting(false);
  };

  const handleDelete = async (u: ManagedUser) => {
    if (u.user_id === user?.id) {
      toast.error("Cannot delete your own account");
      return;
    }
    if (!confirm(`Delete user "${u.display_name}"? This cannot be undone.`)) return;

    const res = await supabase.functions.invoke("admin-manage-users", {
      body: { action: "delete", user_id: u.user_id },
    });
    if (res.data?.error) {
      toast.error(res.data.error);
    } else {
      toast.success("User deleted");
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground text-sm">Create and manage user accounts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gradient-brand text-primary-foreground border-0">
              <Plus className="h-4 w-4 mr-2" /> Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {!editingUser && (
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
                </div>
              )}
              {editingUser && (
                <div className="space-y-2">
                  <Label>New Email (leave blank to keep)</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new@example.com" />
                </div>
              )}
              <div className="space-y-2">
                <Label>{editingUser ? "New Password (leave blank to keep)" : "Password *"}</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. james" />
              </div>
              <div className="space-y-2">
                <Label>Display Name *</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. James Mwangi" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="attendant">Attendant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full gradient-brand text-primary-foreground border-0">
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editingUser ? "Update User" : "Create User"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No users yet. Create your first user above.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {users.map((u) => (
            <div key={u.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">{u.display_name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-medium text-card-foreground">{u.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{u.username} · <span className={cn("capitalize", u.role === "admin" ? "text-primary" : "")}>{u.role}</span></p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(u)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
