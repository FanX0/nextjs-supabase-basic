export type UserRole = "guest" | "user" | "admin" | "super_admin";

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}
