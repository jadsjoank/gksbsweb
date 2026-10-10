import { supabaseAdmin } from "./supabaseAdmin";

export async function logAuditAction({
  actorId,
  actorEmail,
  entityType,
  entityId,
  action,
  details,
}: {
  actorId?: string | null;
  actorEmail?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  details?: Record<string, unknown> | null;
}) {
  try {
    const { error } = await supabaseAdmin.from("audit_logs").insert([
      {
        actor_id: actorId ?? null,
        actor_email: actorEmail ?? null,
        entity_type: entityType,
        entity_id: entityId ?? null,
        action,
        details: details ?? {},
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn("Audit log write failed:", error.message);
    }
  } catch (error) {
    console.warn(
      "Audit log write exception:",
      error instanceof Error ? error.message : "Unknown audit log error"
    );
  }
}
