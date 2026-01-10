export type DriverStatus = 'ACTIVE' | 'INACTIVE';

export interface Driver {
  id: number;

  // Audit fields
  createdOn: string;               // "2026-01-04 07:53:21"
  createBy: string;
  lastModifiedDate: string | null;
  modifiedBy: string | null;

  // Flags
  softDelete: boolean;
  created: boolean;

  // Ownership
  entityId: string;

  // Identity
  username: string;
  phoneNumber: string;
  firstName: string;
  lastName: string;

  // Fleet / relations
  fleetNumber: string;
  investorNumber: string;
  marshalNumber: string;
  registrationNumber: string;

  // Status
  status: DriverStatus;
  allowedActiveDays: number;

  // Active window
  startDate: string;               // "YYYY-MM-DD"
  endDate: string;                 // "YYYY-MM-DD"

  // Optional relations
  stageId: number | null;
}
