export interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  isVerified?: boolean;
  verificationBadge?: "elder" | "mentor" | "expert" | string;
  location?: string;
  createdAt: string;
  bio?: string;
}
