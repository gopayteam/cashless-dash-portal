import { Audit } from "./audit.model";

export interface AuditApiResponse {
  status: number;        // e.g., 0
  message: string;       // e.g., "Active data contents!"
  data: Audit[];         // array of Audit records
  totalRecords: number;  // total count of records (e.g., 4087)
}
