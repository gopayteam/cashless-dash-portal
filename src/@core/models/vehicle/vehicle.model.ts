export interface Vehicle {
  id: number;                   // Unique numeric ID
  createdOn: string;            // Timestamp when created
  createBy: string;             // Creator's email
  lastModifiedDate: string | null; // Last modification timestamp (nullable)
  modifiedBy: string | null;    // Modifier's identifier (nullable)
  softDelete: boolean;          // Soft delete flag
  created: boolean;             // Indicates if entity was created
  entityId: string;             // Organization/entity ID
  entityName: string;           // Organization/entity name
  fleetCode: string;            // Fleet code
  registrationNumber: string;   // Vehicle registration number
  storeNumber: string;          // Store number (may be empty string)
  tillNumber: string;           // Till number (may be empty string)
  fleetNumber: string;          // Fleet number
  capacity: number;             // Total capacity
  seatedCapacity: number;       // Seated capacity
  standingCapacity: number;     // Standing capacity
  otpApproverNumber: string | null; // OTP approver number (nullable)
  investorNumber: string;       // Investor phone number
  marshalNumber: string;        // Marshal phone number
  organizationFeesMaintained: boolean; // Flag for org fees
  status: string;               // Vehicle status (e.g., ACTIVE)
  stageId: number;              // Stage ID
  stageName: string;            // Stage name (e.g., CBD, Kenya Cinema)
}
