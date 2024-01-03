import { Permission } from 'src/users/schemas/permission.schema';
import { Role } from 'src/users/schemas/role.schema';

export interface ActiveUserData {
  sub: string;

  email: string;

  role: Role;

  permission: Permission;
}
