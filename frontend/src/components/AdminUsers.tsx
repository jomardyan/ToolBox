// frontend/src/components/AdminUsers.tsx
import React, { useEffect, useState } from 'react';
import apiClient from '../utils/api';
import AdminLayout from './AdminLayout';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  role: 'ADMIN' | 'USER';
  createdAt: string;
  emailVerified: boolean;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      setActionLoading({ ...actionLoading, [userId]: true });
      const response = await apiClient.post(`/admin/users/${userId}/suspend`);
      if (response.data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'SUSPENDED' } : u));
      }
    } catch (err) {
      setError('Failed to suspend user');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      setActionLoading({ ...actionLoading, [userId]: true });
      const response = await apiClient.post(`/admin/users/${userId}/reactivate`);
      if (response.data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: 'ACTIVE' } : u));
      }
    } catch (err) {
      setError('Failed to reactivate user');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    try {
      setActionLoading({ ...actionLoading, [userId]: true });
      const response = await apiClient.post(`/admin/users/${userId}/make-admin`);
      if (response.data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: 'ADMIN' } : u));
      }
    } catch (err) {
      setError('Failed to make user admin');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    try {
      setActionLoading({ ...actionLoading, [userId]: true });
      const response = await apiClient.post(`/admin/users/${userId}/remove-admin`);
      if (response.data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: 'USER' } : u));
      }
    } catch (err) {
      setError('Failed to remove admin');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      setActionLoading({ ...actionLoading, [userId]: true });
      const response = await apiClient.delete(`/admin/users/${userId}`);
      if (response.data.success) {
        setUsers(users.filter(u => u.id !== userId));
      }
    } catch (err) {
      setError('Failed to delete user');
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  return (
    <AdminLayout title="Users Management">
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Search and Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Total Users: {filteredUsers.length}</h3>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Verified</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm text-gray-900 font-mono">{user.email}</td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">{user.companyName || '-'}</td>
                        <td className="px-6 py-3 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : user.status === 'SUSPENDED'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {user.emailVerified ? '✅' : '⏳'}
                        </td>
                        <td className="px-6 py-3 text-sm space-x-2">
                          {user.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleSuspend(user.id)}
                              disabled={actionLoading[user.id]}
                              className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          )}
                          {user.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleReactivate(user.id)}
                              disabled={actionLoading[user.id]}
                              className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs disabled:opacity-50"
                            >
                              Reactivate
                            </button>
                          )}
                          {user.role === 'USER' && (
                            <button
                              onClick={() => handleMakeAdmin(user.id)}
                              disabled={actionLoading[user.id]}
                              className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs disabled:opacity-50"
                            >
                              Make Admin
                            </button>
                          )}
                          {user.role === 'ADMIN' && user.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleRemoveAdmin(user.id)}
                              disabled={actionLoading[user.id]}
                              className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs disabled:opacity-50"
                            >
                              Remove Admin
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={actionLoading[user.id]}
                            className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
