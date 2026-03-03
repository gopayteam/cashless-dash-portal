// models/app-notification.model.ts

/**
 * Extends the inline Notification interface already used in MainLayoutComponent.
 * Keep this in sync with the interface defined in main-layout.ts.
 */
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;

  // Optional metadata for conflict notifications
  metadata?: {
    tripId?: number;
    fleetNumber?: string;
    tripStatus: string,
    conflictType?: string;
    affectedSeats?: number[];
    affectedPassengers?: string[];
  };
}