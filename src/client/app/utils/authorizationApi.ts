"use client";

import { apiFetch } from './apiClient';

export type UserRole = 'user' | 'librarian' | 'admin';
export type UserStatus = 'active' | 'suspended';
export type HistoryAction = 'PROMOTE' | 'DEMOTE' | 'ADMIN_INVITE';

export interface LiabilityCounts {
  unreturnedBooks: number;
  unpaidFines: number;
}

export interface ManagedAccount {
  userId: string;
  email: string;
  username: string;
  avatar: string | null;
  role: UserRole;
  status: UserStatus;
  branchId: number | null;
  branchName: string | null;
  isSelf: boolean;
  isLastAdmin: boolean;
  isSeniorAdmin: boolean;
  liabilities: LiabilityCounts;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HistoryEntry {
  id: string;
  actor: { userId: string; username: string; avatar: string | null };
  target: { userId: string; username: string; avatar: string | null };
  action: HistoryAction;
  change: string;
  timestamp: string;
}

export interface UsersResult {
  users: ManagedAccount[];
  pagination: Pagination;
}

export interface HistoryResult {
  history: HistoryEntry[];
  pagination: Pagination;
}

export interface Branch {
  branch_id: number;
  name: string;
  name_short: string;
  address: string;
}

const toQueryString = (params: Record<string, string | number | undefined>): string => {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '' && value !== 'all') {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
};

export const listUsers = async (params: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ReturnType<typeof apiFetch<UsersResult>>> => {
  return apiFetch<UsersResult>(
    `/api/authorization/users${toQueryString({ search: params.search, role: params.role, status: params.status, page: params.page, limit: params.limit })}`
  );
};

export const promoteUser = async (
  userId: string,
  targetRole: 'librarian' | 'admin',
  branchId?: number,
  sudoPassword?: string
): Promise<ReturnType<typeof apiFetch<{ message: string; historyEntry: HistoryEntry }>>> => {
  return apiFetch<{ message: string; historyEntry: HistoryEntry }>(`/api/authorization/users/${userId}/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetRole, branchId: branchId || undefined, sudoPassword: sudoPassword || undefined }),
  });
};

export const demoteUser = async (
  userId: string,
  targetRole: 'user' | 'librarian',
  branchId?: number,
  sudoPassword?: string
): Promise<ReturnType<typeof apiFetch<{ message: string; historyEntry: HistoryEntry }>>> => {
  return apiFetch<{ message: string; historyEntry: HistoryEntry }>(`/api/authorization/users/${userId}/demote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetRole, branchId: branchId || undefined, sudoPassword: sudoPassword || undefined }),
  });
};

export const getBranches = async (): Promise<ReturnType<typeof apiFetch<Branch[]>>> => {
  return apiFetch<Branch[]>('/api/branches');
};

export const inviteAdmin = async (
  email: string,
  sudoPassword: string
): Promise<ReturnType<typeof apiFetch<{ message: string }>>> => {
  return apiFetch<{ message: string }>('/api/authorization/invite-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, sudoPassword }),
  });
};

export const getHistory = async (params: {
  action?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ReturnType<typeof apiFetch<HistoryResult>>> => {
  return apiFetch<HistoryResult>(
    `/api/authorization/history${toQueryString({ action: params.action, page: params.page, limit: params.limit })}`
  );
};
