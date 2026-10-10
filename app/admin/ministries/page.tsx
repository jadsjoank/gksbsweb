"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "components/AdminLayout";
import ImageUpload from "components/ImageUpload";

type MinistryMember = {
  name: string;
  position: string;
  bio: string;
  email: string;
  phone: string;
  photo_url: string;
  profession_status: string[];
  device_ownership: string[];
  role_interest: string;
};

type Profile = { slug: string; name: string; description: string; focus: string[]; members: MinistryMember[] };
const categories = ["kemajelisan", "digtive", "pendeta"];
const professionOptions = ["Pelajar/Mahasiswa", "Pegawai", "Wirausaha", "Pekerja Lepas (Freelancer)"];
const deviceOptions = ["Smartphone", "Tablet/iPad", "Notebook/Laptop", "Personal Computer", "DSLR/Mirrorless"];
const roleOptions = ["talent", "mentor", "belum_tahu"];

const emptyMember = (): MinistryMember => ({
  name: "",
  position: "",
  bio: "",
  email: "",
  phone: "",
  photo_url: "",
  profession_status: [],
  device_ownership: [],
  role_interest: "talent",
});

export default function AdminMinistriesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(categories[0]);
  const [form, setForm] = useState<Profile>({ slug: categories[0], name: "", description: "", focus: [""], members: [emptyMember()] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/ministry-profiles")
      .then((response) => response.json())
      .then((data) => setProfiles(data.profiles ?? []))
      .catch(() => setMessage("Gagal memuat profil."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const profile = profiles.find((item) => item.slug === selectedSlug);
    if (profile) {
      setForm({
        ...profile,
        focus: profile.focus.length ? profile.focus : [""],
        members: Array.isArray(profile.members) && profile.members.length ? profile.members : [emptyMember()],
      });
    }
  }, [profiles, selectedSlug]);

  const toggleList = (list: string[], value: string) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = {
      ...form,
      members: (form.members ?? []).map((member) => ({
        name: member.name.trim(),
        position: member.position.trim(),
        bio: member.bio.trim(),
        email: member.email.trim(),
        phone: member.phone.trim(),
        photo_url: member.photo_url.trim(),
        profession_status: Array.isArray(member.profession_status) ? member.profession_status.filter(Boolean) : [],
        device_ownership: Array.isArray(member.device_ownership) ? member.device_ownership.filter(Boolean) : [],
        role_interest: member.role_interest || "belum_tahu",
      })).filter((member) => member.name || member.position || member.bio || member.photo_url || member.profession_status.length || member.device_ownership.length),
    };

    const response = await fetch("/api/admin/ministry-profiles", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Gagal menyimpan profil.");
    else {
      setProfiles((current) => current.map((item) => item.slug === data.profile.slug ? data.profile : item));
      setMessage("Profil berhasil diperbarui.");
    }
    setSaving(false);
  };

  return (
    <AdminLayout title="Profil Pelayanan" description="Perbarui informasi Kemajelisan, DIGTIVE, dan Pendeta.">
      <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
        <section className="h-fit border border-gksbs-border bg-white p-6">
          <p className="label-caps text-gksbs-brown-medium">Kategori pelayanan</p>
          <div className="mt-4 space-y-2">
            {categories.map((category) => (
              <button key={category} type="button" onClick={() => { setSelectedSlug(category); setMessage(""); }}
                className={`w-full border px-4 py-3 text-left text-sm font-semibold capitalize transition ${selectedSlug === category ? "border-gksbs-brown bg-gksbs-brown text-gksbs-gold" : "border-gksbs-border hover:bg-gksbs-cream"}`}>
                {category === "digtive" ? "DIGTIVE" : category}
              </button>
            ))}
          </div>
        </section>
        <form onSubmit={save} className="space-y-6 border border-gksbs-border bg-white p-6 md:p-8">
          <div><p className="label-caps text-gksbs-brown-medium">Konten profil</p><h2 className="mt-2 text-2xl font-semibold text-gksbs-brown">{form.name || "Memuat profil..."}</h2></div>
          {loading ? <p className="text-sm text-gksbs-brown-medium">Memuat...</p> : <>
            <label className="block text-sm font-medium text-gksbs-brown">Nama tampilan<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input mt-2" /></label>
            <label className="block text-sm font-medium text-gksbs-brown">Deskripsi<textarea required rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input mt-2 resize-none" /></label>
            <div><label className="block text-sm font-medium text-gksbs-brown">Bidang pelayanan</label><div className="mt-2 space-y-3">{form.focus.map((item, index) => <input key={index} value={item} onChange={(event) => setForm({ ...form, focus: form.focus.map((current, itemIndex) => itemIndex === index ? event.target.value : current) })} placeholder={`Bidang ${index + 1}`} className="input" />)}</div>{form.focus.length < 6 && <button type="button" onClick={() => setForm({ ...form, focus: [...form.focus, ""] })} className="mt-3 text-sm font-semibold text-gksbs-brown-accent hover:underline">+ Tambah bidang</button>}</div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gksbs-brown">Profil anggota</label>
                <button type="button" onClick={() => setForm({ ...form, members: [...(form.members ?? []), emptyMember()] })} className="text-sm font-semibold text-gksbs-brown-accent hover:underline">+ Tambah anggota</button>
              </div>

              {(form.members ?? []).map((member, index) => (
                <div key={index} className="space-y-4 border border-gksbs-border bg-gksbs-cream p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm font-medium text-gksbs-brown">Nama<input value={member.name} onChange={(event) => setForm({ ...form, members: form.members.map((current, memberIndex) => memberIndex === index ? { ...current, name: event.target.value } : current) })} className="input mt-2" placeholder="Nama lengkap" /></label>
                    <label className="block text-sm font-medium text-gksbs-brown">Jabatan<input value={member.position} onChange={(event) => setForm({ ...form, members: form.members.map((current, memberIndex) => memberIndex === index ? { ...current, position: event.target.value } : current) })} className="input mt-2" placeholder="Pendeta / Koordinator / Tim" /></label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block text-sm font-medium text-gksbs-brown">Email<input value={member.email} onChange={(event) => setForm({ ...form, members: form.members.map((current, memberIndex) => memberIndex === index ? { ...current, email: event.target.value } : current) })} className="input mt-2" placeholder="nama@email.com" /></label>
                    <label className="block text-sm font-medium text-gksbs-brown">No. HP<input value={member.phone} onChange={(event) => setForm({ ...form, members: form.members.map((current, memberIndex) => memberIndex === index ? { ...current, phone: event.target.value } : current) })} className="input mt-2" placeholder="08xxxx" /></label>
                  </div>

                  <label className="block text-sm font-medium text-gksbs-brown">Biografi<textarea rows={3} value={member.bio} onChange={(event) => setForm({ ...form, members: form.members.map((current, memberIndex) => memberIndex === index ? { ...current, bio: event.target.value } : current) })} className="input mt-2 resize-none" placeholder="Ceritakan tugas dan latar belakang anggota..." /></label>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gksbs-brown">Status profesi</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {professionOptions.map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm text-gksbs-brown-medium">
                          <input
                            type="checkbox"
                            checked={member.profession_status.includes(option)}
                            onChange={() => setForm({
                              ...form,
                              members: form.members.map((current, memberIndex) => memberIndex === index ? {
                                ...current,
                                profession_status: toggleList(current.profession_status || [], option),
                              } : current),
                            })}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gksbs-brown">Perangkat yang dimiliki</label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {deviceOptions.map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm text-gksbs-brown-medium">
                          <input
                            type="checkbox"
                            checked={member.device_ownership.includes(option)}
                            onChange={() => setForm({
                              ...form,
                              members: form.members.map((current, memberIndex) => memberIndex === index ? {
                                ...current,
                                device_ownership: toggleList(current.device_ownership || [], option),
                              } : current),
                            })}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-gksbs-brown">Pilih peran sebagai apa
                    <select
                      value={member.role_interest || "talent"}
                      onChange={(event) => setForm({
                        ...form,
                        members: form.members.map((current, memberIndex) => memberIndex === index ? { ...current, role_interest: event.target.value } : current),
                      })}
                      className="input mt-2"
                    >
                      {roleOptions.map((option) => (
                        <option key={option} value={option}>{option === "talent" ? "Talent" : option === "mentor" ? "Mentor" : "Belum Tahu"}</option>
                      ))}
                    </select>
                  </label>

                  <ImageUpload
                    value={member.photo_url}
                    label="Foto anggota"
                    onChange={(url) => setForm({ ...form, members: form.members.map((current, memberIndex) => memberIndex === index ? { ...current, photo_url: url } : current) })}
                  />

                  <button type="button" onClick={() => setForm({ ...form, members: form.members.filter((_, memberIndex) => memberIndex !== index) || [emptyMember()] })} className="text-sm font-semibold text-red-600 hover:underline">Hapus anggota</button>
                </div>
              ))}
            </div>
            {message && <p className="text-sm text-gksbs-brown-medium">{message}</p>}
            <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Perubahan"}</button>
          </>}
        </form>
      </div>
    </AdminLayout>
  );
}
