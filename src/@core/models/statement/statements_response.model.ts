import { Statement } from "./statements.model";

export interface StatementApiResponse {
  status: number;          // Response status code (e.g., 0 for success)
  message: string;         // Response message (e.g., "Statements")
  data: Statement[];       // Array of statement entries
  totalRecords: number;    // Total number of records available
}
