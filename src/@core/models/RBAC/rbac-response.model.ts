import { RbacRolesData } from "./rbac.model";

export interface RbacRolesResponse {
  status: number;
  message: string;
  data: RbacRolesData;
  totalRecords: number;
}
