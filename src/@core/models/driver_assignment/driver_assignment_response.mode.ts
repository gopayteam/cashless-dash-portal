import { ActiveDriverAssignment, DormantDriverAssignment, GeneralDriverAssignment, InactiveDriverAssignment, PendingDriverAssignment, RejectedDriverAssignment } from "./driver_assignment.model";

export interface DriverAssignmentApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Active data contents!")
  data: GeneralDriverAssignment[];      // Array of active data entries
  totalRecords: number;    // Total number of records available
}

export interface ActiveDriverAssignmentApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Active data contents!")
  data: ActiveDriverAssignment[];      // Array of active data entries
  totalRecords: number;    // Total number of records available
}

export interface InactiveDriverAssignmentApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Active data contents!")
  data: InactiveDriverAssignment[];      // Array of active data entries
  totalRecords: number;    // Total number of records available
}

export interface RejectedDriverAssignmentApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Active data contents!")
  data: RejectedDriverAssignment[];      // Array of active data entries
  totalRecords: number;    // Total number of records available
}

export interface DormantDriverAssignmentApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Active data contents!")
  data: DormantDriverAssignment[];      // Array of active data entries
  totalRecords: number;    // Total number of records available
}

export interface PendingDriverAssignmentApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Active data contents!")
  data: PendingDriverAssignment[];      // Array of active data entries
  totalRecords: number;    // Total number of records available
}
