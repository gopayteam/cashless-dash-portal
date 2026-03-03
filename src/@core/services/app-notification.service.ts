// services/app-notification.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { AppNotification } from '../models/notifications/app-notification.model';

/**
 * AppNotificationService
 *
 * A central signal-based store for in-app notifications.
 * MainLayoutComponent subscribes to `notifications$` and `unreadCount`
 * so the bell badge and notification list stay in sync automatically.
 *
 * Any service (e.g. BookingConflictService) can call `push()` to add
 * a notification without needing a direct reference to the layout.
 */
@Injectable({ providedIn: 'root' })
export class AppNotificationService {
  // ── Private signal holding all notifications ──────────────────────────────
  private _notifications = signal<AppNotification[]>([]);

  // ── Public read-only views ─────────────────────────────────────────────────
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.read).length
  );

  // ── Max notifications to keep in memory ───────────────────────────────────
  private readonly MAX_NOTIFICATIONS = 50;

  /**
   * Push a new notification.
   * Deduplicates by id — calling push() with the same id twice is a no-op.
   */
  push(notification: Omit<AppNotification, 'id' | 'time' | 'read'> & Partial<Pick<AppNotification, 'id' | 'time' | 'read'>>): void {
    const now = new Date();
    const newNotification: AppNotification = {
      id: notification.id ?? `notif_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
      time: notification.time ?? this.formatTime(now),
      read: notification.read ?? false,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      metadata: notification.metadata,
    };

    this._notifications.update(existing => {
      // Deduplicate
      if (existing.some(n => n.id === newNotification.id)) {
        return existing;
      }
      // Prepend and cap list size
      return [newNotification, ...existing].slice(0, this.MAX_NOTIFICATIONS);
    });
  }

  /** Mark a single notification as read */
  markAsRead(id: string): void {
    this._notifications.update(list =>
      list.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }

  /** Mark all notifications as read */
  markAllAsRead(): void {
    this._notifications.update(list => list.map(n => ({ ...n, read: true })));
  }

  /** Remove a single notification */
  remove(id: string): void {
    this._notifications.update(list => list.filter(n => n.id !== id));
  }

  /** Clear all notifications */
  clearAll(): void {
    this._notifications.set([]);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private formatTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;

    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;

    return date.toLocaleDateString();
  }
}