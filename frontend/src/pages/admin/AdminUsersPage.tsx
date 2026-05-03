import React, { useEffect, useState } from 'react';
import { adminGetUsers, adminCreateStaff, adminActivateUser, adminDeactivateUser } from '../../api/admin';
import type { User } from '../../types';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  const fetchUsers = () => {
    adminGetUsers()
      .then((res) => setUsers(res.data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminCreateStaff(form);
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', password: '' });
      fetchUsers();
    } catch {
      setError('Failed to create staff user.');
    }
  };

  const toggleActive = async (user: User) => {
    try {
      if (user.active) await adminDeactivateUser(user.id);
      else await adminActivateUser(user.id);
      fetchUsers();
    } catch {
      setError('Failed to update user status.');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Users Management</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Staff</button>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Staff Account</h2>
            <form onSubmit={handleCreateStaff}>
              {(['firstName', 'lastName', 'email', 'password'] as const).map((f) => (
                <div className="form-group" key={f}>
                  <label>{f}</label>
                  <input
                    type={f === 'password' ? 'password' : f === 'email' ? 'email' : 'text'}
                    value={form[f]}
                    onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                    required
                  />
                </div>
              ))}
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td><span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span></td>
              <td>{user.active ? '✅ Active' : '❌ Inactive'}</td>
              <td>
                <button
                  className={`btn btn-sm ${user.active ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => toggleActive(user)}
                >
                  {user.active ? 'Deactivate' : 'Activate'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUsersPage;
