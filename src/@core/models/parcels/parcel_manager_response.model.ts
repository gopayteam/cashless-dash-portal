import { ParcelManager } from "./parcel_manager.model";

export interface ParcelManagersApiResponse {
  status: number;         // API status code (0 = success, etc.)
  message: string;        // optional message from API
  data: ParcelManager[];  // list of parcel managers
  totalRecords: number;   // total number of parcel managers in system
}
