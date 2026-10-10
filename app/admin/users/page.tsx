"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "components/AdminLayout";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  member_since: string | null;
  last_login: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.status === "ok") setUsers(data.users);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      }
    } catch { /* ignore */ }
    setUpdating(null);
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, is_active: !currentActive }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_active: !currentActive } : u));
      }
    } catch { /* ignore */ }
    setUpdating(null);
  };

  return (
    <AdminLayout title="Manajemen Jemaat" description="Kelola data anggota, peran, dan status keaktifan jemaat.">
      <div className="border border-[#e5e5e5] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e5e5e5] bg-surface-low">
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Nama</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Email</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Peran</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Anggota Sejak</th>
                <th className="px-6 py-4 text-left font-semibold text-on-surface">Login Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-muted">Memuat...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-on-surface-muted">Belum ada data jemaat.</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-[#e5e5e5] hover:bg-surface-low transition">
                    <td className="px-6 py-4 font-medium text-on-surface">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e5e5e5] text-xs font-bold text-on-surface-muted">
                          {(user.full_name || user.email)[0].toUpperCase()}
                        </div>
                        {user.full_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-muted">{user.email}</td>
                    <td className="px-6 py-4">
                      {/* Role Toggle */}
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={updating === user.id}
                        className={`rounded-full px-3 py-1 text-xs font-semibold border-0 outline-none cursor-pointer transition ${
                          user.role === "Admin"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-surface-container text-on-surface-muted"
                        } ${updating === user.id ? "opacity-50" : ""}`}
                      >
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                        <option value="Guest">Guest</option>
                        <option value="Penulis">Penulis</option>
                        <option value="Seller">Seller</option>
                        <option value="Bendahara">Bendahara</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        disabled={updating === user.id}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          user.is_active
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        } ${updating === user.id ? "opacity-50" : ""}`}
                      >
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-on-surface-muted">
                      {user.member_since
                        ? new Date(user.member_since).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-on-surface-muted">
                      {user.last_login
                        ? new Date(user.last_login).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false })
                        : "Belum login"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-[#e5e5e5] px-6 py-4 text-sm text-on-surface-muted">
          Total: {users.length} jemaat
        </div>
      </div>
    </AdminLayout>
  );
}
