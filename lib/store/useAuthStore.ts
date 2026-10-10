import { create } from "zustand";
import type { Role } from "lib/roles";

interface AuthState {
  user: { id: string; email: string; role: Role } | null;
  setUser: (user: AuthState["user"]) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  signOut: () => set({ user: null })
}));
