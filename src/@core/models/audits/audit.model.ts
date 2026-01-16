export interface Audit {
  id: number;
  createdOn: string;          // ISO timestamp string
  createBy?: string | null;   // can be null
  lastModifiedDate?: string | null;
  modifiedBy?: string | null;
  softDelete: boolean;
  created: boolean;
  username: string;
  requestUrl: string;
  method: string;             // e.g., "POST"
  requestBody: string;        // raw JSON string
  ipAddress: string;
  description: string;
  operatingSystem: string;    // e.g., "Windows"
}
