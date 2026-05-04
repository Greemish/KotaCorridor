import { useState, useEffect } from 'react';
import { adminGetUsers, adminCreateStaff, adminActivateUser, adminDeactivateUser } from '../../api/admin';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { AppUser } from '../../types';

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [saving, setSaving] = useState(false);

  const fetchUsers = () => {
    adminGetUsers().then((res) => setUsers(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateStaff = async () => {
    setSaving(true);
    try {
      await adminCreateStaff(form);
      setShowForm(false);
      setForm({ name: '', email: '', password: '' });
      fetchUsers();
    } catch {
      alert('Failed to create staff user.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: AppUser) => {
    try {
      if (user.active) await adminDeactivateUser(user.id);
      else await adminActivateUser(user.id);
      fetchUsers();
    } catch {
      alert('Failed to update user status.');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button onClick={() => setShowForm(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium">+ Add Staff</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Role</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-gray-500">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'STAFF' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => toggleActive(user)} className={`text-sm ${user.active ? 'text-red-500 hover:underline' : 'text-green-600 hover:underline'}`}>
                    {user.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="bg-black/30 absolute inset-0" onClick={() => setShowForm(false)} />
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-50">
            <h2 className="text-xl font-bold mb-4">Create Staff User</h2>
            <div className="space-y-3">
              {[{ label: 'Name', field: 'name', type: 'text' }, { label: 'Email', field: 'email', type: 'email' }, { label: 'Password', field: 'password', type: 'password' }].map(({ label, field, type }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(form as Record<string, string>)[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleCreateStaff} disabled={saving} className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-semibold">
                {saving ? 'Creating...' : 'Create'}
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
