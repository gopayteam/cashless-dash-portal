// pages/notifications/notifications.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppNotificationService } from '../../../../@core/services/app-notification.service';
import { AppNotification } from '../../../../@core/models/notifications/app-notification.model';


type FilterType = 'all' | 'unread' | 'error' | 'warning' | 'info' | 'success';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    TooltipModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './notifications.html',
  styleUrls: ['./notifications.css'],
})
export class NotificationsComponent implements OnInit {

  activeFilter: FilterType = 'all';

  typeFilterOptions = [
    { label: 'All Notifications', value: 'all' },
    { label: 'Unread Only', value: 'unread' },
    { label: 'Errors', value: 'error' },
    { label: 'Warnings', value: 'warning' },
    { label: 'Info', value: 'info' },
    { label: 'Success', value: 'success' },
  ];

  constructor(
    public notificationService: AppNotificationService,
    private messageService: MessageService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { }

  // ── Derived lists ─────────────────────────────────────────────────────────

  get allNotifications(): AppNotification[] {
    return this.notificationService.notifications();
  }

  get filteredNotifications(): AppNotification[] {
    const all = this.allNotifications;
    switch (this.activeFilter) {
      case 'unread': return all.filter(n => !n.read);
      case 'error': return all.filter(n => n.type === 'error');
      case 'warning': return all.filter(n => n.type === 'warning');
      case 'info': return all.filter(n => n.type === 'info');
      case 'success': return all.filter(n => n.type === 'success');
      default: return all;
    }
  }

  get unreadCount(): number {
    return this.notificationService.unreadCount();
  }

  get errorCount(): number {
    return this.allNotifications.filter(n => n.type === 'error' && !n.read).length;
  }

  get warningCount(): number {
    return this.allNotifications.filter(n => n.type === 'warning' && !n.read).length;
  }

  get infoCount(): number {
    return this.allNotifications.filter(n => n.type === 'info' && !n.read).length;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
  }

  markAsRead(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.messageService.add({
      severity: 'success',
      summary: 'Done',
      detail: 'All notifications marked as read',
      life: 3000,
    });
  }

  remove(notification: AppNotification, event: Event): void {
    event.stopPropagation();
    this.notificationService.remove(notification.id);
  }

  clearAll(): void {
    this.notificationService.clearAll();
    this.messageService.add({
      severity: 'info',
      summary: 'Cleared',
      detail: 'All notifications have been cleared',
      life: 3000,
    });
  }

  /** If the notification is about a booking conflict, navigate there */
  handleNotificationClick(notification: AppNotification): void {
    this.notificationService.markAsRead(notification.id);

    if (notification.metadata?.conflictType) {
      this.router.navigate(['/booking/trip-conflicts']);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getTypeIcon(type: AppNotification['type']): string {
    const map: Record<AppNotification['type'], string> = {
      error: 'pi pi-times-circle',
      warning: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle',
      success: 'pi pi-check-circle',
    };
    return map[type];
  }

  getTypeLabel(type: AppNotification['type']): string {
    const map: Record<AppNotification['type'], string> = {
      error: 'Critical',
      warning: 'Warning',
      info: 'Info',
      success: 'Success',
    };
    return map[type];
  }

  trackById(_: number, n: AppNotification): string {
    return n.id;
  }
}