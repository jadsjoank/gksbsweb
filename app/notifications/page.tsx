"use client";

import { useCallback, useEffect, useState } from "react";
import { PageShell } from "components/PageShell";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

type NotificationsResponse = {
  status: string;
  notifications?: Notification[];
  page?: number;
  limit?: number;
  total?: number;
  message?: string;
};

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState<string | null>(null);

  const loadNotifications = useCallback(async (requestedPage: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notifications?page=${requestedPage}&limit=${PAGE_SIZE}`, { signal });
      const data = (await response.json().catch(() => ({}))) as NotificationsResponse;

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Silakan login untuk melihat notifikasi."
            : data.message || "Notifikasi tidak dapat dimuat."
        );
      }

      setNotifications(data.notifications ?? []);
      setPage(data.page ?? requestedPage);
      setTotal(data.total ?? 0);
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === "AbortError") return;
      setError(requestError instanceof Error ? requestError.message : "Notifikasi tidak dapat dimuat.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadNotifications(1, controller.signal);
    return () => controller.abort();
  }, [loadNotifications]);

  const markAsRead = async (notificationId: string) => {
    setMarkingRead(notificationId);
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: notificationId }),
      });
      const data = (await response.json().catch(() => ({}))) as NotificationsResponse;

      if (!response.ok) {
        throw new Error(data.message || "Notifikasi gagal ditandai sudah dibaca.");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification
        )
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Notifikasi gagal diperbarui.");
    } finally {
      setMarkingRead(null);
    }
  };

  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <PageShell title="Notifications" description="See announcements, reminders, and ministry updates in one place.">
      <div className="mx-auto max-w-3xl">
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void loadNotifications(page)}
              className="shrink-0 font-semibold underline"
            >
              Coba lagi
            </button>
          </div>
        )}

        {loading ? (
          <div className="border border-[#e5e5e5] bg-white p-8 text-center text-on-surface-muted">
            Memuat notifikasi...
          </div>
        ) : notifications.length === 0 ? (
          <div className="border border-dashed border-[#e5e5e5] bg-white p-12 text-center">
            <p className="font-semibold text-on-surface">Belum ada notifikasi.</p>
            <p className="mt-2 text-sm text-on-surface-muted">Pengumuman dan pembaruan akan muncul di sini.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`border bg-white p-5 ${
                    notification.is_read ? "border-[#e5e5e5]" : "border-black"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-on-surface">{notification.title}</h2>
                        {!notification.is_read && (
                          <span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            Baru
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-on-surface-muted">{notification.body}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface-low px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-muted">
                      {notification.type}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#e5e5e5] pt-3">
                    <time dateTime={notification.created_at} className="text-xs text-on-surface-muted">
                      {new Date(notification.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                    {!notification.is_read && (
                      <button
                        type="button"
                        onClick={() => void markAsRead(notification.id)}
                        disabled={markingRead === notification.id}
                        className="text-xs font-semibold text-on-surface underline disabled:opacity-50"
                      >
                        {markingRead === notification.id ? "Memperbarui..." : "Tandai sudah dibaca"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-[#e5e5e5] pt-5">
                <button
                  type="button"
                  onClick={() => void loadNotifications(page - 1)}
                  disabled={page <= 1 || loading}
                  className="border border-[#e5e5e5] px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="text-sm text-on-surface-muted">
                  Halaman {page} dari {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => void loadNotifications(page + 1)}
                  disabled={page >= pageCount || loading}
                  className="border border-[#e5e5e5] px-4 py-2 text-sm font-semibold disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}
