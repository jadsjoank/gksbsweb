"use client";

import { useState } from "react";

type Props = {
  positionId: string; positionTitle: string;
  profileId: string; defaultName?: string; defaultEmail?: string;
};

const professionOptions = [
  "Pelajar/Mahasiswa",
  "Pegawai",
  "Wirausaha",
  "Pekerja Lepas (Freelancer)",
];

const deviceOptions = [
  "Smartphone",
  "Tablet/iPad",
  "Notebook/Laptop",
  "Personal Computer",
  "DSLR/Mirrorless",
];

const roleOptions = [
  { value: "talent", label: "Talent" },
  { value: "mentor", label: "Mentor" },
  { value: "belum_tahu", label: "Belum Tahu" },
];

export default function VolunteerForm({
  positionId, positionTitle, profileId,
  defaultName = "", defaultEmail = "",
}: Props) {
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState("");
  const [motivation, setMotivation] = useState("");
  const [professionStatus, setProfessionStatus] = useState<string[]>([]);
  const [deviceOwnership, setDeviceOwnership] = useState<string[]>([]);
  const [roleInterest, setRoleInterest] = useState(roleOptions[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggleCheckbox = (value: string, list: string[], setList: (next: string[]) => void) => {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setResult(null);
    try {
      const notes = JSON.stringify({
        profession_status: professionStatus,
        device_ownership: deviceOwnership,
        role_interest: roleInterest,
      });

      const res = await fetch("/api/volunteer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position_id: positionId,
          profile_id: profileId,
          full_name: fullName,
          email,
          phone,
          motivation,
          profession_status: professionStatus,
          device_ownership: deviceOwnership,
          role_interest: roleInterest,
          notes,
        }),
      });
      const data = await res.json().catch(() => ({ error: "Server error" }));
      if (res.ok && data.status === "ok") {
        setResult({ type: "success", text: "Pendaftaran berhasil! Tim kami akan menghubungi Anda segera." });
      } else {
        setResult({ type: "error", text: data.error || "Gagal mengirim pendaftaran." });
      }
    } catch {
      setResult({ type: "error", text: "Tidak dapat terhubung ke server." });
    }
    setSubmitting(false);
  };

  if (result?.type === "success") {
    return (
      <div className="border border-[#e5e5e5] p-12 text-center">
        <p className="text-h3 font-bold mb-3">Pendaftaran Berhasil!</p>
        <p className="text-body text-on-surface-muted">{result.text}</p>
        <button onClick={() => setResult(null)} className="btn-secondary mt-6">Daftar Lagi</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {result?.type === "error" && (
        <div className="border border-red-200 bg-red-50 p-4 text-body-sm text-red-800">{result.text}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="label-caps block mb-2">Nama Lengkap <span className="text-error">*</span></label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Nama lengkap Anda" className="input" />
        </div>
        <div>
          <label className="label-caps block mb-2">Email <span className="text-error">*</span></label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@contoh.com" className="input" />
        </div>
      </div>

      <div>
        <label className="label-caps block mb-2">No. Telepon / WhatsApp</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx" className="input" />
      </div>

      <div>
        <label className="label-caps block mb-2">Status profesi</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-[#e5e5e5] bg-[#f9f8f6] p-4">
          {professionOptions.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-on-surface-muted">
              <input
                type="checkbox"
                checked={professionStatus.includes(option)}
                onChange={() => toggleCheckbox(option, professionStatus, setProfessionStatus)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label-caps block mb-2">Apakah perangkat Anda miliki</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-[#e5e5e5] bg-[#f9f8f6] p-4">
          {deviceOptions.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-on-surface-muted">
              <input
                type="checkbox"
                checked={deviceOwnership.includes(option)}
                onChange={() => toggleCheckbox(option, deviceOwnership, setDeviceOwnership)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="role-interest" className="label-caps block mb-2">Pilih peran sebagai apa</label>
        <select id="role-interest" value={roleInterest} onChange={(e) => setRoleInterest(e.target.value)} className="input" required>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-caps block mb-2">Motivasi Bergabung <span className="text-error">*</span></label>
        <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} required rows={4} placeholder={`Ceritakan mengapa Anda ingin bergabung di ${positionTitle}...`} className="input resize-none" />
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Mengirim..." : "Kirim Pendaftaran →"}
      </button>
    </form>
  );
}
