"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "components/AdminLayout";
import ImageUpload from "components/ImageUpload";

type VolunteerPosition = {
  id: string;
  title: string;
  department: string;
  description: string | null;
  slots: number;
  is_open: boolean;
  image_url: string | null;
};

type VolunteerAssignment = {
  id: string;
  position_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  motivation: string | null;
  status: string;
  notes: string | null;
  created_at: string;
};

type ParsedVolunteerMeta = {
  profession_status: string[];
  device_ownership: string[];
  role_interest: string | null;
};

const parseVolunteerMeta = (notes: string | null): ParsedVolunteerMeta => {
  if (!notes) return { profession_status: [], device_ownership: [], role_interest: null };

  try {
    const parsed = JSON.parse(notes);
    return {
      profession_status: Array.isArray(parsed?.profession_status) ? parsed.profession_status.filter((item: unknown): item is string => typeof item === "string") : [],
      device_ownership: Array.isArray(parsed?.device_ownership) ? parsed.device_ownership.filter((item: unknown): item is string => typeof item === "string") : [],
      role_interest: typeof parsed?.role_interest === "string" ? parsed.role_interest : null,
    };
  } catch {
    return { profession_status: [], device_ownership: [], role_interest: null };
  }
};

const formatRoleLabel = (value: string | null) => {
  if (!value) return "—";
  if (value === "talent") return "Talent";
  if (value === "mentor") return "Mentor";
  if (value === "belum_tahu") return "Belum Tahu";
  return value;
};

type EditPositionState = {
  id: string;
  title: string;
  department: string;
  description: string;
  slots: number;
  image_url: string;
};

export default function AdminVolunteerPage() {
  const [positions, setPositions] = useState<VolunteerPosition[]>([]);
  const [assignments, setAssignments] = useState<VolunteerAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDept, setFormDept] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSlots, setFormSlots] = useState(1);
  const [formImage, setFormImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  // Detail drawer: show applicants for a position
  const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);

  // Edit position modal
  const [editPos, setEditPos] = useState<EditPositionState | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/volunteer");
      const data = await res.json();
      if (data.status === "ok") {
        setPositions(data.positions);
        setAssignments(data.assignments);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddPosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/admin/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle, department: formDept, description: formDesc, slots: formSlots, image_url: formImage }),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (res.ok && data.status === "ok") {
        setFormMsg("Posisi berhasil ditambahkan!");
        setFormTitle(""); setFormDept(""); setFormDesc(""); setFormSlots(1); setFormImage("");
        setShowForm(false);
        fetchData();
      } else {
        setFormMsg(data.error || "Gagal menambahkan posisi.");
      }
    } catch { setFormMsg("Tidak dapat terhubung ke server."); }
    setSubmitting(false);
  };

  const handleToggleOpen = async (pos: VolunteerPosition) => {
    await fetch("/api/admin/volunteer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "position", id: pos.id, is_open: !pos.is_open }),
    });
    fetchData();
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPos) return;
    setEditSubmitting(true);
    setEditMsg(null);
    try {
      const res = await fetch("/api/admin/volunteer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "position", id: editPos.id,
          title: editPos.title, department: editPos.department,
          description: editPos.description, slots: editPos.slots, image_url: editPos.image_url,
        }),
      });
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setEditPos(null);
        fetchData();
      } else {
        setEditMsg(data.error || "Gagal menyimpan.");
      }
    } catch { setEditMsg("Tidak dapat terhubung."); }
    setEditSubmitting(false);
  };

  const handleAssignmentStatus = async (id: string, status: string) => {
    await fetch("/api/admin/volunteer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "assignment", id, status }),
    });
    fetchData();
  };

  const assignmentsByPosition = new Map<string, VolunteerAssignment[]>();
  assignments.forEach((a) => {
    const list = assignmentsByPosition.get(a.position_id) || [];
    list.push(a);
    assignmentsByPosition.set(a.position_id, list);
  });

  const totalPending = assignments.filter((a) => a.status === "pending").length;
  const totalApproved = assignments.filter((a) => a.status === "approved").length;
  const selectedApplicants = selectedPositionId ? (assignmentsByPosition.get(selectedPositionId) ?? []) : [];
  const selectedPos = positions.find((p) => p.id === selectedPositionId);

  return (
    <AdminLayout title="Volunteer Management" description="Kelola posisi pelayanan, review pendaftar, dan jadwal volunteer.">
      {/* Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-gksbs-border bg-white p-6 shadow-sm">
          <p className="text-sm text-gksbs-brown-medium">Posisi Terbuka</p>
          <p className="mt-1 text-2xl font-bold text-gksbs-brown">{positions.filter((p) => p.is_open).length}</p>
        </div>
        <div className="rounded-3xl border border-gksbs-border bg-white p-6 shadow-sm">
          <p className="text-sm text-gksbs-brown-medium">Menunggu Review</p>
          <p className="mt-1 text-2xl font-bold text-gksbs-brown-accent">{totalPending}</p>
        </div>
        <div className="rounded-3xl border border-gksbs-border bg-white p-6 shadow-sm">
          <p className="text-sm text-gksbs-brown-medium">Volunteer Aktif</p>
          <p className="mt-1 text-2xl font-bold text-gksbs-brown">{totalApproved}</p>
        </div>
      </div>

      {/* Positions Table */}
      <div className="rounded-3xl border border-gksbs-border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-gksbs-border px-6 py-4">
          <h2 className="text-lg font-semibold text-gksbs-brown">Posisi Pelayanan</h2>
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-gksbs-brown px-4 py-2 text-sm font-medium text-gksbs-gold hover:bg-gksbs-brown-medium transition">
            {showForm ? "✕ Tutup" : "+ Tambah Posisi"}
          </button>
        </div>

        {/* Add Position Form */}
        {showForm && (
          <div className="border-b border-gksbs-border bg-gksbs-cream p-6">
            <form onSubmit={handleAddPosition} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gksbs-brown mb-1">Nama Posisi</label>
                  <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required placeholder="Contoh: Singer, Multimedia"
                    className="w-full rounded-2xl border border-gksbs-border bg-white px-4 py-2.5 text-sm text-gksbs-brown outline-none focus:border-gksbs-brown-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gksbs-brown mb-1">Departemen</label>
                  <input value={formDept} onChange={(e) => setFormDept(e.target.value)} required placeholder="Contoh: Worship, Multimedia"
                    className="w-full rounded-2xl border border-gksbs-border bg-white px-4 py-2.5 text-sm text-gksbs-brown outline-none focus:border-gksbs-brown-accent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gksbs-brown mb-1">Deskripsi (opsional)</label>
                <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={2} placeholder="Tugas dan tanggung jawab..."
                  className="w-full rounded-2xl border border-gksbs-border bg-white px-4 py-2.5 text-sm text-gksbs-brown outline-none focus:border-gksbs-brown-accent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gksbs-brown mb-1">Kuota</label>
                <input type="number" min={1} value={formSlots} onChange={(e) => setFormSlots(Number(e.target.value))}
                  className="w-32 rounded-2xl border border-gksbs-border bg-white px-4 py-2.5 text-sm text-gksbs-brown outline-none focus:border-gksbs-brown-accent" />
              </div>
              <ImageUpload value={formImage} onChange={setFormImage} label="Gambar Pelayanan (opsional)" />
              {formMsg && <p className={`text-sm ${formMsg.includes("berhasil") ? "text-green-700" : "text-red-600"}`}>{formMsg}</p>}
              <button type="submit" disabled={submitting}
                className="rounded-full bg-gksbs-brown px-6 py-2.5 text-sm font-semibold text-gksbs-gold transition hover:bg-gksbs-brown-medium disabled:opacity-50">
                {submitting ? "Menyimpan..." : "Simpan Posisi"}
              </button>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gksbs-border bg-gksbs-cream">
                <th className="px-6 py-4 text-left font-semibold text-gksbs-brown">Posisi</th>
                <th className="px-6 py-4 text-left font-semibold text-gksbs-brown">Departemen</th>
                <th className="px-6 py-4 text-left font-semibold text-gksbs-brown">Kuota</th>
                <th className="px-6 py-4 text-left font-semibold text-gksbs-brown">Pendaftar</th>
                <th className="px-6 py-4 text-left font-semibold text-gksbs-brown">Status</th>
                <th className="px-6 py-4 text-left font-semibold text-gksbs-brown">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gksbs-brown-medium">Memuat...</td></tr>
              ) : positions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gksbs-brown-medium">Belum ada posisi. Klik &quot;Tambah Posisi&quot;.</td></tr>
              ) : (
                positions.map((pos) => {
                  const applicants = assignmentsByPosition.get(pos.id) ?? [];
                  const pending = applicants.filter((a) => a.status === "pending").length;
                  return (
                    <tr key={pos.id} className="border-b border-gksbs-border hover:bg-gksbs-cream transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {pos.image_url && (
                            <img src={pos.image_url} alt={pos.title} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-medium text-gksbs-brown">{pos.title}</p>
                            {pos.description && <p className="text-xs text-gksbs-brown-medium mt-0.5 line-clamp-1">{pos.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gksbs-brown-medium">{pos.department}</td>
                      <td className="px-6 py-4 text-gksbs-brown">{pos.slots}</td>
                      <td className="px-6 py-4">
                        <button onClick={() => setSelectedPositionId(pos.id === selectedPositionId ? null : pos.id)}
                          className="flex items-center gap-1.5 text-gksbs-brown-accent hover:underline font-medium">
                          {applicants.length} orang
                          {pending > 0 && (
                            <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-800">{pending} pending</span>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pos.is_open ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {pos.is_open ? "Terbuka" : "Tutup"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEditPos({ id: pos.id, title: pos.title, department: pos.department, description: pos.description ?? "", slots: pos.slots, image_url: pos.image_url ?? "" })}
                            className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
                          <button onClick={() => handleToggleOpen(pos)}
                            className={`text-xs font-medium hover:underline ${pos.is_open ? "text-red-600" : "text-green-600"}`}>
                            {pos.is_open ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applicants Detail Panel */}
      {selectedPositionId && (
        <div className="mt-8 rounded-3xl border border-gksbs-border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gksbs-border px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gksbs-brown">Pendaftar: {selectedPos?.title}</h2>
              <p className="text-xs text-gksbs-brown-medium mt-0.5">{selectedApplicants.length} pendaftar total</p>
            </div>
            <button onClick={() => setSelectedPositionId(null)} className="text-sm text-gksbs-brown-medium hover:text-gksbs-brown">✕ Tutup</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gksbs-border bg-gksbs-cream">
                  <th className="px-6 py-3 text-left font-semibold text-gksbs-brown">Nama</th>
                  <th className="px-6 py-3 text-left font-semibold text-gksbs-brown">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gksbs-brown">Telepon</th>
                  <th className="px-6 py-3 text-left font-semibold text-gksbs-brown">Motivasi</th>
                  <th className="px-6 py-3 text-left font-semibold text-gksbs-brown">Tanggal</th>
                  <th className="px-6 py-3 text-left font-semibold text-gksbs-brown">Status</th>
                  <th className="px-6 py-3 text-left font-semibold text-gksbs-brown">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {selectedApplicants.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-10 text-center text-gksbs-brown-medium">Belum ada pendaftar.</td></tr>
                ) : (
                  selectedApplicants.map((a) => {
                    const meta = parseVolunteerMeta(a.notes);
                    return (
                      <tr key={a.id} className="border-b border-gksbs-border hover:bg-gksbs-cream transition">
                        <td className="px-6 py-4 font-medium text-gksbs-brown">{a.full_name}</td>
                        <td className="px-6 py-4 text-gksbs-brown-medium">{a.email}</td>
                        <td className="px-6 py-4 text-gksbs-brown-medium">{a.phone || "—"}</td>
                        <td className="px-6 py-4 text-gksbs-brown-medium max-w-xs">
                          <div className="space-y-2">
                            <p className="line-clamp-2">{a.motivation || "—"}</p>
                            {(meta.profession_status.length > 0 || meta.device_ownership.length > 0 || meta.role_interest) && (
                              <div className="space-y-1 text-[11px]">
                                {meta.profession_status.length > 0 && (
                                  <div><span className="font-semibold text-gksbs-brown">Profesi:</span> {meta.profession_status.join(", ")}</div>
                                )}
                                {meta.device_ownership.length > 0 && (
                                  <div><span className="font-semibold text-gksbs-brown">Perangkat:</span> {meta.device_ownership.join(", ")}</div>
                                )}
                                {meta.role_interest && (
                                  <div><span className="font-semibold text-gksbs-brown">Peran:</span> {formatRoleLabel(meta.role_interest)}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gksbs-brown-medium whitespace-nowrap">
                          {new Date(a.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            a.status === "approved" ? "bg-green-100 text-green-700" :
                            a.status === "rejected" ? "bg-red-100 text-red-700" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {a.status === "approved" ? "Diterima" : a.status === "rejected" ? "Ditolak" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {a.status !== "approved" && (
                              <button onClick={() => handleAssignmentStatus(a.id, "approved")}
                                className="text-xs text-green-600 hover:underline font-medium">Terima</button>
                            )}
                            {a.status !== "rejected" && (
                              <button onClick={() => handleAssignmentStatus(a.id, "rejected")}
                                className="text-xs text-red-600 hover:underline font-medium">Tolak</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Position Modal */}
      {editPos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="text-lg font-bold text-gksbs-brown mb-6">Edit Posisi</h2>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gksbs-brown mb-1">Nama Posisi</label>
                  <input value={editPos.title} onChange={(e) => setEditPos({ ...editPos, title: e.target.value })} required
                    className="w-full rounded-2xl border border-gksbs-border px-4 py-2.5 text-sm text-gksbs-brown outline-none focus:border-gksbs-brown-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gksbs-brown mb-1">Departemen</label>
                  <input value={editPos.department} onChange={(e) => setEditPos({ ...editPos, department: e.target.value })} required
                    className="w-full rounded-2xl border border-gksbs-border px-4 py-2.5 text-sm text-gksbs-brown outline-none focus:border-gksbs-brown-accent" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gksbs-brown mb-1">Deskripsi</label>
                <textarea value={editPos.description} onChange={(e) => setEditPos({ ...editPos, description: e.target.value })} rows={2}
                  className="w-full rounded-2xl border border-gksbs-border px-4 py-2.5 text-sm text-gksbs-brown outline-none focus:border-gksbs-brown-accent resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gksbs-brown mb-1">Kuota</label>
                <input type="number" min={1} value={editPos.slots} onChange={(e) => setEditPos({ ...editPos, slots: Number(e.target.value) })}
                  className="w-32 rounded-2xl border border-gksbs-border px-4 py-2.5 text-sm text-gksbs-brown outline-none focus:border-gksbs-brown-accent" />
              </div>
              <ImageUpload
                value={editPos.image_url}
                onChange={(url) => setEditPos({ ...editPos, image_url: url })}
                label="Gambar Pelayanan"
              />
              {editMsg && <p className="text-sm text-red-600">{editMsg}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editSubmitting}
                  className="rounded-full bg-gksbs-brown px-6 py-2.5 text-sm font-semibold text-gksbs-gold hover:bg-gksbs-brown-medium transition disabled:opacity-50">
                  {editSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
                <button type="button" onClick={() => { setEditPos(null); setEditMsg(null); }}
                  className="rounded-full border border-gksbs-border px-6 py-2.5 text-sm font-medium text-gksbs-brown hover:bg-gksbs-cream transition">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
