export interface User {
  id: number;
  email: string;
  agent: string;          // e.g., "ADMIN"
  profile: string;        // e.g., "DASHMASTER", "SUPER_ADMIN"
  idNumber?: string | null;
  channel: string;        // e.g., "APP", "PORTAL"
  blocked: boolean;
  entityId: string;       // e.g., "GS000002"
  username: string;
  lastName: string;
  firstName: string;
  phoneNumber: string;
  firstLogin: boolean;
  softDelete: boolean;
  loginTrials: number;
  createdOn: string;      // ISO timestamp string
}
