export interface UserRecord {
  userId: string;
  username: string;
  email: string;
  phoneNumber: string | null;
  avatar: string | null;
  role: 'admin' | 'librarian' | 'user';
  status: 'active' | 'suspended';
  joinedDate: string;
  lastLogin: string | null;
}

export interface UserDetails extends UserRecord {
  suspendedReason: string | null;
}

export interface StatsData {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  librariansCount: number;
}
