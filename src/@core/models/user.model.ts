import { Role } from './role.model';

export class User {
  id!: number;
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  avatar!: string;
  role!: Role;
  token?: string;
}
