import { UserAttributes } from '../models/User';

/**
 * User View — serializes user data, stripping sensitive fields like password hashes.
 */
export interface UserPublicProfile {
  uuid: string;
  username: string;
  email: string;
  role: string;
  createdAt?: Date;
}

/**
 * Formats a User model instance into a safe public profile DTO.
 * Ensures the password hash is never included in API responses.
 */
export function formatUserProfile(user: Partial<UserAttributes>): UserPublicProfile {
  return {
    uuid: user.uuid!,
    username: user.username!,
    email: user.email!,
    role: user.role!,
    createdAt: user.createdAt,
  };
}
