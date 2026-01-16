export type DriverAssignment = PendingDriverAssignment | ActiveDriverAssignment | InactiveDriverAssignment | DormantDriverAssignment | GeneralDriverAssignment;



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

// Fetch all driver assignments that are pending approval
export interface PendingDriverAssignment extends BaseDriverAssignment {
  approved: boolean;
  approvalCount: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
}

// Fetch all driver assignments that are active
export interface ActiveDriverAssignment extends BaseDriverAssignment {
  status: "ACTIVE";
  approved: boolean;
  startDate: string;
  endDate: string;
}

// Fetch all driver assignments that are inactive
export interface InactiveDriverAssignment extends BaseDriverAssignment {
  status: "INACTIVE";
  approved: boolean;
  endDate: string;
}

// Fetch all driver assignments that are rejected
export interface RejectedDriverAssignment extends BaseDriverAssignment {
  status: "REJECTED";
  approved: boolean;
  endDate: string;
}

// Fetch all driver assignments that are neither active nor inactive
export interface DormantDriverAssignment extends BaseDriverAssignment {
  status: "DORMANT";
  endDate?: string;
}

// Fetch all driver assignments
export interface GeneralDriverAssignment extends BaseDriverAssignment {
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  startDate?: string;
  endDate?: string;
}

