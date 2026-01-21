import { Vehicle } from "./vehicle.model";

export interface VehicleApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Vehicle data.")
  data: Vehicle[];         // Array of vehicle objects
  totalRecords: number;    // Total number of records available
}
