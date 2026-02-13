export type DriverAssignment =
  | PendingDriverAssignment
  | RejectedDriverAssignment
  | ActiveDriverAssignment
  | InactiveDriverAssignment
  | DormantDriverAssignment;

export interface BaseDriverAssignment {
  id: number;
  createdOn: string;
  createBy: string;
  lastModifiedDate?: string | null;
  modifiedBy?: string | null;
  softDelete: boolean;
  created: boolean;
  entityId: string;
  username: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  fleetNumber: string;
  investorNumber: string;
  marshalNumber: string;
  registrationNumber: string;
  allowedActiveDays: number;
  stageId?: number | null;
}

/* ---------------- PENDING ---------------- */

export interface PendingDriverAssignment extends BaseDriverAssignment {
  approved: false;
  approvalCount: number;
  approvalStatus: "PENDING";
}

/* ---------------- REJECTED ---------------- */

export interface RejectedDriverAssignment extends BaseDriverAssignment {
  approved: true;
  approvalCount: number;
  approvalStatus: "REJECTED";
}

/* ---------------- ACTIVE ---------------- */

export interface ActiveDriverAssignment extends BaseDriverAssignment {
  status: "ACTIVE";
  startDate: string;
  endDate: string;
}

/* ---------------- INACTIVE ---------------- */

export interface InactiveDriverAssignment extends BaseDriverAssignment {
  status: "INACTIVE";
  startDate: string;
  endDate: string;
}

/* ---------------- DORMANT (future-proof) ---------------- */

export interface DormantDriverAssignment extends BaseDriverAssignment {
  status: "DORMANT";
  endDate?: string;
}

/**
 * General driver assignment interface that can represent any status
 * Used when fetching all driver assignments where the status can be mixed
 *
 * This interface includes all optional properties that might exist across
 * different driver assignment types to avoid TypeScript errors when accessing them
 */
export interface GeneralDriverAssignment extends BaseDriverAssignment {
  // Status field - required for all assignments in the general view
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED" | "DORMANT";

  // Date fields - present in ACTIVE, INACTIVE, DORMANT assignments
  startDate?: string;
  endDate?: string;

  // Approval fields - present in PENDING and REJECTED assignments
  approved?: boolean;
  approvalCount?: number;
  approvalStatus?: "PENDING" | "REJECTED" | "APPROVED";
}

export type AnyDriverAssignment =
  | PendingDriverAssignment
  | RejectedDriverAssignment
  | ActiveDriverAssignment
  | InactiveDriverAssignment
  | DormantDriverAssignment;
