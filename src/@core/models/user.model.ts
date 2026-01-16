import { Role } from './role.model';

export class AuthUser {
  id!: number;
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  avatar!: string;
  role!: Role;
  token?: string;
}
