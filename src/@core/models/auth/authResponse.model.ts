import { AuthUser } from "./auth-user.model";


export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  totalRecords?: number;
}

export type LoginResponse = ApiResponse<AuthUser>;

export interface AuthResponse {
  status: number;
  message: string;
  data: AuthUser;
  totalRecords?: number;
}
