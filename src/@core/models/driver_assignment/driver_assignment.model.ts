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

// Fetch all driver assignments
export interface GeneralDriverAssignment extends BaseDriverAssignment {
  status: "ACTIVE" | "INACTIVE" | "PENDING" | "REJECTED";
  startDate?: string;
  endDate?: string;
}

export type AnyDriverAssignment =
  | PendingDriverAssignment
  | RejectedDriverAssignment
  | ActiveDriverAssignment
  | InactiveDriverAssignment
  | DormantDriverAssignment;


