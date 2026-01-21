import { User } from "./user.model";

export interface UserApiResponse {
  status: number;         // e.g., 0
  message: string;        // e.g., "Active data contents!"
  data: User[];           // array of User objects
}
