import { Role } from "../role.model";

export interface RbacRolesData {
  profilesRoles: Role[];
  pagination: Pagination;
}


export interface Pagination {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
