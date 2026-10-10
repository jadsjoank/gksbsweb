"use client";

import { useEffect, useState } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const [requirements, setRequirements] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });

  useEffect(() => {
    setRequirements({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const allMet = Object.values(requirements).every(Boolean);
  const metCount = Object.values(requirements).filter(Boolean).length;

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gksbs-border rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              allMet
                ? "bg-green-600"
                : metCount >= 3
                  ? "bg-yellow-500"
                  : metCount >= 1
                    ? "bg-orange-500"
                    : "bg-red-500"
            }`}
            style={{ width: `${(metCount / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-gksbs-brown-medium">
          {metCount}/5
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className={`flex items-center gap-2 ${requirements.minLength ? "text-green-600" : "text-gksbs-brown-medium"}`}>
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            requirements.minLength ? "border-green-600 bg-green-600" : "border-gksbs-border"
          }`}>
            {requirements.minLength && <span className="text-white text-xs">✓</span>}
          </span>
          <span>Minimal 8 karakter</span>
        </div>

        <div className={`flex items-center gap-2 ${requirements.uppercase ? "text-green-600" : "text-gksbs-brown-medium"}`}>
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            requirements.uppercase ? "border-green-600 bg-green-600" : "border-gksbs-border"
          }`}>
            {requirements.uppercase && <span className="text-white text-xs">✓</span>}
          </span>
          <span>Huruf kapital (A-Z)</span>
        </div>

        <div className={`flex items-center gap-2 ${requirements.lowercase ? "text-green-600" : "text-gksbs-brown-medium"}`}>
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            requirements.lowercase ? "border-green-600 bg-green-600" : "border-gksbs-border"
          }`}>
            {requirements.lowercase && <span className="text-white text-xs">✓</span>}
          </span>
          <span>Huruf kecil (a-z)</span>
        </div>

        <div className={`flex items-center gap-2 ${requirements.number ? "text-green-600" : "text-gksbs-brown-medium"}`}>
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            requirements.number ? "border-green-600 bg-green-600" : "border-gksbs-border"
          }`}>
            {requirements.number && <span className="text-white text-xs">✓</span>}
          </span>
          <span>Angka (0-9)</span>
        </div>

        <div className={`flex items-center gap-2 ${requirements.specialChar ? "text-green-600" : "text-gksbs-brown-medium"}`}>
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
            requirements.specialChar ? "border-green-600 bg-green-600" : "border-gksbs-border"
          }`}>
            {requirements.specialChar && <span className="text-white text-xs">✓</span>}
          </span>
          <span>Karakter spesial (!@#$%^&*)</span>
        </div>
      </div>
    </div>
  );
}
