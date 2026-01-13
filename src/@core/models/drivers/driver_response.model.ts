import { Driver } from "./driver.model";

// DriverResponse.ts
export interface DriveApiResponse {
  status: number;        // e.g. 0
  message: string;       // e.g. "Active data contents!"
  data: Driver[];        // list of drivers
  totalRecords: number;  // e.g. 50
}