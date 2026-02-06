// Allowed agents for broadcast
type Agent =
  | "DASHMASTER"
  | "APPROVER"
  | "INSPECTOR"
  | "DRIVER"
  | "PARCEL"
  | "PASSENGER"
  | "MARSHAL"
  | "ADMIN"
  | "CONDUCTOR"
  | "INVESTOR";

// Broadcast request payload
interface BroadcastRequest {
  entityId: string; // Optional
  agent: Agent;      // Must be one of the allowed agents
  message: string;   // Notification body
  title: string;     // Notification title
}

interface BroadcastResponse {
  status: number;       // 0 = success, non-zero = error codes
  message: string;      // Summary of the process
  data: any[];          // Optional extra payload (empty if none)
  totalRecords: number; // Number of recipients notified
}
