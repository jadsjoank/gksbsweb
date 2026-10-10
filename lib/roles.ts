export const ROLES = ["Guest", "User", "Admin", "Penulis", "Seller", "Bendahara"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  Guest: "Tamu",
  User: "Jemaat",
  Admin: "Administrator",
  Penulis: "Penulis",
  Seller: "Seller",
  Bendahara: "Bendahara",
};

export const ROLE_HOME: Record<Exclude<Role, "Guest">, string> = {
  User: "/dashboard",
  Admin: "/admin/dashboard",
  Penulis: "/penulis",
  Seller: "/seller",
  Bendahara: "/bendahara",
};

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
