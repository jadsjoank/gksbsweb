"use client";

import { useEffect, useState } from "react";

type Props = {
  targetDate: string; // ISO string
  eventTitle: string;
  eventLocation: string | null;
};

function pad(n: number) { return String(Math.max(0, n)).padStart(2, "0"); }

export default function EventCountdown({ targetDate, eventTitle, eventLocation }: Props) {
  const [diff, setDiff] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setDiff(new Date(targetDate).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (diff === null) return null;

  const past    = diff <= 0;
  const total   = Math.max(0, Math.floor(diff / 1000));
  const days    = Math.floor(total / 86400);
  const hours   = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return (
    <div className="border-b border-[#ffffff22] bg-black backdrop-blur-sm">
      <div className="container py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Event info */}
        <div>
          <p className="text-body-lg text-white/70 font-bold">
            {past ? "Sedang Berlangsung" : "Event Berikutnya"}
          </p>
          <p className="text-body-lg text-white font-semibold">{eventTitle}</p>
        </div>

        {/* Countdown */}
        {!past ? (
          <div className="flex items-end gap-4 md:gap-6">
            {[
              { value: pad(days),    label: "HARI" },
              { value: pad(hours),   label: "JAM" },
              { value: pad(minutes), label: "MENIT" },
              { value: pad(seconds), label: "DETIK" },
            ].map((unit) => (
              <div key={unit.label} className="text-center">
                <p className="text-h1 font-black text-white tracking-tighter leading-none tabular-nums">
                  {unit.value}
                </p>
                <p className="label-caps text-white/40 mt-1">{unit.label}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-h3 font-bold text-white">Sedang berlangsung sekarang →</p>
        )}
      </div>
    </div>
  );
}
