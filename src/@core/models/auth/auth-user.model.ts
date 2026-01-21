import { AuthRole } from "./auth-role.model";

export interface AuthUser {
  token: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  entityId: string;
  channel: 'PORTAL' | 'MOBILE' | string;
  profile: string;
  firstLogin: boolean;
  roles: AuthRole[];
}
