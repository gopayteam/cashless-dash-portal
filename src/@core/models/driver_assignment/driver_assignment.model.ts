export interface DriverAssignment {
  id: number;                   // Unique numeric ID
  createdOn: string;            // Timestamp when created
  createBy: string;             // Creator identifier (phone/email)
  lastModifiedDate: string | null; // Last modification timestamp (nullable)
  modifiedBy: string | null;    // Modifier identifier (nullable)
  softDelete: boolean;          // Soft delete flag
  created: boolean;             // Indicates if entity was created
  entityId: string;             // Organization/entity ID
  username: string;             // Username (often phone number)
  phoneNumber: string;          // Driver’s phone number
  firstName: string;            // First name
  lastName: string;             // Last name
  fleetNumber: string;          // Fleet number
  investorNumber: string;       // Investor phone number
  marshalNumber: string;        // Marshal phone number
  approved: boolean;            // Approval flag
  approvalCount: number;        // Number of approvals
  allowedActiveDays: number;    // Allowed active days
  registrationNumber: string;   // Vehicle registration number
  approvalStatus: string;       // Approval status (e.g., PENDING)
  stageId: number;              // Stage ID
}
