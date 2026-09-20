import type { Permission } from "../../config/permissions.js";
import type { Role } from "../../generated/prisma/enums.js";

/** The user as the web app sees them. Never contains the password hash or any security counter. */
export interface AuthenticatedUser {
  id: string;
  role: Role;
  name: string;
  email: string | null;
  phone: string | null;
  /** When true the person must set a new password before anything else works. */
  mustChangePassword: boolean;
  /** For hiding UI only. The API enforces permissions itself on every request. */
  permissions: Permission[];
}
