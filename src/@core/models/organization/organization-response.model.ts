import { Organization } from "./organization.model";

export interface OrganizationsApiResponse {
  status: number;
  message: string;
  data: Organization[];
  totalRecords: number;
}
