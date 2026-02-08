import React, {useEffect, useState} from 'react';
import {Edit2, Key, Plus, Search, Shield, Trash2, UserCheck, UserX} from 'lucide-react';
import {formatDate, getInitials} from '../utils/helpers';
import {useAuth} from '../hooks/useAuth';
import toast from 'react-hot-toast';
import {userService} from "../services/userService";

export default function UsersPage() {
    const [users, setUsers] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const {user: currentUser} = useAuth();

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'TAILOR'
    });

    const [editForm, setEditForm] = useState({
        email: '',
        role: '',
        is_active: true
    });

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(u =>
            u.username.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase())
        );
        setFiltered(filtered);
    }, [search, users]);

    const loadUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
            setFiltered(data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await userService.createUser(form);
            toast.success('User created successfully!');
            setShowModal(false);
            setForm({username: '', email: '', password: '', role: 'TAILOR'});
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to create user');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setEditForm({
            email: user.email,
            role: user.role,
            is_active: user.is_active
        });
        setShowEditModal(true);
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        try {
            await userService.updateUser(editingUser.id, editForm);
            toast.success('User updated successfully!');
            setShowEditModal(false);
            setEditingUser(null);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update user');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            await userService.deleteUser(userId);
            toast.success('User deleted successfully');
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to delete user');
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            await userService.updateUser(userId, {is_active: !currentStatus});
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
            loadUsers();
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Failed to update status');
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center py-12">
            <div className="loader"></div>
        </div>;
    }

    const roleColors = {
        ADMIN: 'bg-red-100 text-red-800 border-red-200',
        TAILOR: 'bg-blue-100 text-blue-800 border-blue-200',
        CASHIER: 'bg-green-100 text-green-800 border-green-200'
    };

    const roleIcons = {
        ADMIN: Shield,
        TAILOR: Key,
        CASHIER: UserCheck
    };

    const roles = ['ADMIN', 'TAILOR', 'CASHIER'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                    <p className="text-gray-600 mt-1">{users.length} total users</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
                    <Plus className="h-4 w-4"/>
                    Add User
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="h-5 w-5"/>
                </div>
                <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field !pl-10"
                />
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((user) => {
                    const RoleIcon = roleIcons[user.role] || UserCheck;
                    const isCurrentUser = user.id === currentUser?.id;

                    return (
                        <div key={user.id} className="card hover:shadow-lg transition-shadow group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-12 w-12 ${user.is_active ? 'bg-gradient-to-br from-primary-500 to-primary-600' : 'bg-gray-400'} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                                        {getInitials(user.username)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{user.username}</h3>
                                            {isCurrentUser && (
                                                <span
                                                    className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">You</span>
                                            )}
                                        </div>
                                        <span
                                            className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border font-medium mt-1 ${roleColors[user.role]}`}>
                      <RoleIcon className="h-3 w-3"/>
                                            {user.role}
                    </span>
                                    </div>
                                </div>

                                {!isCurrentUser && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit User"
                                        >
                                            <Edit2 className="h-4 w-4 text-blue-600"/>
                                        </button>
                                        <button
                                            onClick={() => toggleUserStatus(user.id, user.is_active)}
                                            className={`p-2 hover:bg-${user.is_active ? 'orange' : 'green'}-50 rounded-lg transition-colors`}
                                            title={user.is_active ? 'Deactivate' : 'Activate'}
                                        >
                                            {user.is_active ? (
                                                <UserX className="h-4 w-4 text-orange-600"/>
                                            ) : (
                                                <UserCheck className="h-4 w-4 text-green-600"/>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 className="h-4 w-4 text-red-600"/>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Email:</span>
                                    <span className="text-gray-900 font-medium truncate ml-2">{user.email}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Status:</span>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="text-gray-900">{formatDate(user.created_at)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                    <p className="text-gray-500">No users found</p>
                </div>
            )}

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}/>

                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-semibold mb-6">Create New User</h3>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={(e) => setForm({...form, username: e.target.value})}
                                        className="input-field"
                                        required
                                        minLength={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({...form, email: e.target.value})}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({...form, password: e.target.value})}
                                        className="input-field"
                                        required
                                        minLength={8}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                                    <select
                                        value={form.role}
                                        onChange={(e) => setForm({...form, role: e.target.value})}
                                        className="input-field"
                                        required
                                    >
                                        {roles.map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowModal(false)}
                                            className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-screen items-center justify-center p-4">
                        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowEditModal(false)}/>

                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-semibold mb-6">Edit User - {editingUser.username}</h3>

                            <form onSubmit={handleUpdateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                                    <select
                                        value={editForm.role}
                                        onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                        className="input-field"
                                        required
                                    >
                                        {roles.map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={editForm.is_active}
                                            onChange={(e) => setEditForm({...editForm, is_active: e.target.checked})}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700">Active User</span>
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowEditModal(false)}
                                            className="btn-secondary flex-1">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary flex-1">
                                        Update User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
