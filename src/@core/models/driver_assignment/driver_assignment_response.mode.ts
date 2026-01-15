import { DriverAssignment } from "./driver_assignment.model";

export interface DriverAssignmentApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Active data contents!")
  data: DriverAssignment[];      // Array of active data entries
  totalRecords: number;    // Total number of records available
}
