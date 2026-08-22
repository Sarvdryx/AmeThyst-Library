"use client";

import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../../providers/I18nProvider';
import { apiFetch, authHeaders } from '../../utils/apiClient';
import { getLoggedInUser } from '../../utils/user';
import { UserRecord, StatsData, UserDetails } from '../../types/admin';

import { UserFilterToolbar, PaginationControls } from '../../components/molecules';
import { UserManagementKpiCards, UserDirectoryTable } from '../../components/organisms';
import { UserDetailsModal, UserManageModal } from '../../components/modals';

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const currentUser = getLoggedInUser();

  // Directory filter states
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    librariansCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [userDetailedData, setUserDetailedData] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [manageUser, setManageUser] = useState<UserRecord | null>(null);
  
  // Mutation edit states
  const [newRole, setNewRole] = useState<'admin' | 'librarian' | 'user'>('user');
  const [newStatus, setNewStatus] = useState<'active' | 'suspended'>('active');
  const [suspendReason, setSuspendReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Debouncing search string
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch count stats and list
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statsRes = await apiFetch<StatsData>('/api/admin/users/stats');
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      const listRes = await apiFetch<UserRecord[]>(
        `/api/admin/users?search=${encodeURIComponent(debouncedSearch)}&role=${selectedRole}&status=${selectedStatus}&page=${page}&limit=10`
      );
      if (listRes.success && listRes.data) {
        setUsers(listRes.data);
        if (listRes.meta) {
          setTotalPages(listRes.meta.totalPages);
          setTotalItems(listRes.meta.totalItems);
        }
      } else {
        setError(listRes.message || t('admin.error_retrieve_users'));
      }
    } catch (err) {
      console.error('Fetch Admin Data Error:', err);
      setError(t('admin.error_connection'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, selectedRole, selectedStatus, t]);

  useEffect(() => {
    const requestTimer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(requestTimer);
  }, [fetchData]);

  // CSV Export Trigger
  const handleExportCSV = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const url = `${API_URL}/api/admin/users/export?search=${encodeURIComponent(debouncedSearch)}&role=${selectedRole}&status=${selectedStatus}`;
      
      const response = await fetch(url, {
        headers: await authHeaders(),
        credentials: 'include',
      });

      if (!response.ok) {
        alert(t('admin.error_export_csv'));
        return;
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('CSV Export Error:', err);
      alert(t('admin.error_file_compilation'));
    }
  };

  // Open Details Dialog
  const handleOpenDetails = async (user: UserRecord) => {
    setSelectedUser(user);
    setLoadingDetails(true);
    try {
      const res = await apiFetch<UserDetails>(`/api/admin/users/${user.userId}`);
      if (res.success) {
        setUserDetailedData(res.data);
      }
    } catch (e) {
      console.error('Load user details error:', e);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Manage Dialog
  const handleOpenManage = (user: UserRecord) => {
    setManageUser(user);
    setNewRole(user.role);
    setNewStatus(user.status);
    setSuspendReason('');
    setMutationError(null);
  };

  // Submit Mutations
  const handleSubmitManage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manageUser) return;

    if (manageUser.userId === currentUser?.userId) {
      setMutationError(t('admin.error_self_mutation'));
      return;
    }

    setSubmitting(true);
    setMutationError(null);

    try {
      let toastMsg = t('admin.toast_role_success');

      // 1. Check if role changed
      if (newRole !== manageUser.role) {
        const roleRes = await apiFetch(`/api/admin/users/${manageUser.userId}/role`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        });
        if (!roleRes.success) {
          setMutationError(roleRes.message || t('admin.error_final_admin'));
          setSubmitting(false);
          return;
        }
        toastMsg = t('admin.toast_role_success');
      }

      // 2. Check if status changed
      if (newStatus !== manageUser.status) {
        if (newStatus === 'suspended') {
          if (!suspendReason.trim()) {
            setMutationError(t('admin.error_reason_required'));
            setSubmitting(false);
            return;
          }
          const suspendRes = await apiFetch(`/api/admin/users/${manageUser.userId}/suspend`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason: suspendReason }),
          });
          if (!suspendRes.success) {
            setMutationError(suspendRes.message || t('admin.error_final_admin'));
            setSubmitting(false);
            return;
          }
          toastMsg = t('admin.toast_status_suspended_success');
        } else {
          const restoreRes = await apiFetch(`/api/admin/users/${manageUser.userId}/unsuspend`, {
            method: 'PUT',
          });
          if (!restoreRes.success) {
            setMutationError(restoreRes.message || t('admin.error_unsuspend'));
            setSubmitting(false);
            return;
          }
          toastMsg = t('admin.toast_status_unsuspended_success');
        }
      }

      // Success
      setSuccessToast(toastMsg);
      setManageUser(null);
      fetchData();
      
      setTimeout(() => {
        setSuccessToast(null);
      }, 3000);

    } catch (err) {
      console.error('Mutation submission error:', err);
      setMutationError(t('admin.error_internal'));
    } finally {
      setSubmitting(false);
    }
  };

  // Keyboard Close Helpers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedUser(null);
        setManageUser(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col gap-8 w-full select-none">
      
      {/* Toast Alert Feedback */}
      {successToast && (
        <div className="fixed top-24 right-8 z-50 bg-[#1D1C16] text-[#F8F3E9] py-3 px-6 rounded-md shadow-lg border border-neutral-700 font-manrope animate-fade-in flex items-center gap-3">
          <svg className="w-5 h-5 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <h1 className="font-manrope text-3xl font-extrabold text-[#1A2E44] dark:text-neutral-100 tracking-wide uppercase">
          {t('admin.page_title')}
        </h1>
      </div>

      {/* KPI Dashboard Metrics Cards */}
      <UserManagementKpiCards stats={stats} loading={loading} />

      {/* Directory Search & Filters Toolbar */}
      <UserFilterToolbar
        search={search}
        selectedRole={selectedRole}
        selectedStatus={selectedStatus}
        onSearchChange={setSearch}
        onRoleChange={(val) => {
          setSelectedRole(val);
          setPage(1);
        }}
        onStatusChange={(val) => {
          setSelectedStatus(val);
          setPage(1);
        }}
        onExportClick={handleExportCSV}
      />

      {/* Directory Main white data-table */}
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-300 dark:border-neutral-700 shadow-sm overflow-hidden flex flex-col">
        <UserDirectoryTable
          users={users}
          loading={loading}
          error={error}
          currentUserId={currentUser?.userId}
          onViewDetails={handleOpenDetails}
          onManage={handleOpenManage}
        />
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </div>

      {/* VIEW DETAILS MODAL */}
      <UserDetailsModal
        user={selectedUser}
        detailedData={userDetailedData}
        loading={loadingDetails}
        onClose={() => setSelectedUser(null)}
      />

      {/* MANAGE ROLE & STATUS MODAL */}
      <UserManageModal
        manageUser={manageUser}
        newRole={newRole}
        newStatus={newStatus}
        suspendReason={suspendReason}
        mutationError={mutationError}
        submitting={submitting}
        onRoleChange={setNewRole}
        onStatusChange={setNewStatus}
        onReasonChange={setSuspendReason}
        onSubmit={handleSubmitManage}
        onClose={() => setManageUser(null)}
      />

    </div>
  );
}
