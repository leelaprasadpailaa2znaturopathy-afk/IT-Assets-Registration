import React, { useEffect, useState } from "react";
import { api } from "../utils/api";
import { User } from "../types";
import { Plus, Edit2, Trash2, Search, X, ShieldAlert, Eye, ShieldCheck, UserCheck, Copy } from "lucide-react";

type UserRole = "SuperAdmin" | "Admin" | "User";

interface UserManagementViewProps {
    currentUser: User | null;
}

export default function UserManagementView({ currentUser }: UserManagementViewProps) {
    const canManageUsers = currentUser?.role === "Admin" || currentUser?.role === "SuperAdmin";
    const canDeleteUsers = currentUser?.role === "SuperAdmin";
    const canAssignAdminRoles = currentUser?.role === "SuperAdmin";

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("User");
    const [activeStatus, setActiveStatus] = useState(true);

    // Delete confirmation modal
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getAllUsers();
            setUsers(res.users || []);
        } catch (err: any) {
            setError(err.message || "Failed to load user directory.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    const closeAndResetForm = () => {
        setModalOpen(false);
        setEditingId(null);
        setError(null);
        setName("");
        setEmail("");
        setPassword("");
        setRole("User");
        setActiveStatus(true);
    };

    const openAddModal = () => {
        closeAndResetForm();
        setModalOpen(true);
    };

    const openEditModal = (user: User) => {
        closeAndResetForm();
        setEditingId(user._id);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setActiveStatus(user.activeStatus ?? true);
        setModalOpen(true);
    };

    const openDeleteConfirm = (userId: string, userName: string) => {
        setDeleteTarget({ id: userId, name: userName });
        setDeleteConfirmOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim() || !email.trim()) {
            setError("Full name and corporate email are required.");
            return;
        }

        if (!editingId && !password) {
            setError("Password is required when creating a new user.");
            return;
        }

        try {
            if (editingId) {
                const payload: Partial<User> = {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    role,
                    activeStatus,
                };
                await api.updateUser(editingId, payload);
                showSuccess("User credentials revised successfully.");
            } else {
                const payload: any = {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password,
                    role,
                    activeStatus,
                };
                await api.createUser(payload);
                showSuccess("New system user registered.");
            }
            closeAndResetForm();
            fetchUsers();
        } catch (err: any) {
            setError(err.message || "Failed to save user record.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await api.deleteUser(deleteTarget.id);
            showSuccess(`User "${deleteTarget.name}" has been removed from the system.`);
            setDeleteConfirmOpen(false);
            setDeleteTarget(null);
            fetchUsers();
        } catch (err: any) {
            setError(err.message || "Failed to delete user.");
        }
    };

    const qClean = searchQuery.toLowerCase().trim();
    const filteredUsers = users.filter((u) =>
        u.name.toLowerCase().includes(qClean) ||
        u.email.toLowerCase().includes(qClean) ||
        u.role.toLowerCase().includes(qClean)
    );

    const roleBadge = (role: UserRole) => {
        const base = "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border";
        switch (role) {
            case "SuperAdmin":
                return `${base} bg-violet-50 border-violet-200 text-violet-700`;
            case "Admin":
                return `${base} bg-teal-50 border-teal-200 text-teal-700`;
            default:
                return `${base} bg-slate-100 border-slate-200 text-slate-600`;
        }
    };

    const roleLabel = (role: UserRole) => {
        switch (role) {
            case "SuperAdmin": return "Super Admin";
            case "Admin": return "Admin";
            default: return "Standard User";
        }
    };

    return (
        <div id="user-management-wrapper" className="space-y-6 font-sans">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-teal-600" />
                        System User Directory
                    </h2>
                    <p className="text-[11px] text-slate-450 mt-1">
                        Manage corporate access credentials and system clearance levels.
                    </p>
                </div>

                {canManageUsers ? (
                    <button
                        id="add-user-btn"
                        type="button"
                        onClick={openAddModal}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Register New User</span>
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
                        <Eye className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Role: Read-Only Access</span>
                    </div>
                )}
            </div>

            {/* Success Banner */}
            {successMsg && (
                <div id="user-success-bar" className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <span>✔</span> {successMsg}
                </div>
            )}

            {/* Search Bar */}
            {canManageUsers && (
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Search className="h-4 w-4" />
                    </span>
                    <input
                        id="user-search-input"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users by name, email, or role..."
                        className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-450 focus:outline-none focus:ring-2 focus:ring-teal-500/15 focus:border-teal-500 transition shadow-sm"
                    />
                </div>
            )}

            {/* Data Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 text-xs font-mono">
                    <span className="h-6 w-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading user directory...</span>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="px-6 py-4">Full Name</th>
                                <th className="px-6 py-4">Corporate Email</th>
                                <th className="px-6 py-4">System Role</th>
                                <th className="px-6 py-4">Status</th>
                                {canManageUsers && <th className="px-6 py-4 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                                        No user records found in directory.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u._id} className="hover:bg-slate-50/60 transition">
<td className="px-6 py-4 font-bold text-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold text-[10px]">
                                                    {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  {u.name}
                                                  <button
                                                    onClick={() => navigator.clipboard.writeText(u.name).then(() => {})}
                                                    className="text-slate-400 hover:text-teal-600 transition"
                                                    title="Copy Name"
                                                  >
                                                    <Copy className="h-3 w-3" />
                                                  </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-600">
                                          <div className="flex items-center gap-1">
                                            {u.email}
                                            <button
                                              onClick={() => navigator.clipboard.writeText(u.email).then(() => {})}
                                              className="text-slate-400 hover:text-teal-600 transition"
                                              title="Copy Email"
                                            >
                                              <Copy className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`${roleBadge(u.role)}`}>
                                                {u.role === "SuperAdmin" && <ShieldCheck className="h-3 w-3 inline mr-1" />}
                                                {u.role === "Admin" && <ShieldAlert className="h-3 w-3 inline mr-1" />}
                                                {u.role === "User" && <UserCheck className="h-3 w-3 inline mr-1" />}
                                                {roleLabel(u.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-semibold border ${u.activeStatus ?? true
                                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                : "bg-rose-50 border-rose-200 text-rose-700"
                                                }`}>
                                                {u.activeStatus ?? true ? "Active" : "Suspended"}
                                            </span>
                                        </td>
                                        {canManageUsers && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2.5">
                                                    <button
                                                        onClick={() => openEditModal(u)}
                                                        className="p-1.5 px-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 className="h-3.5 w-3.5" />
                                                    </button>
                                                    {canDeleteUsers && u._id !== currentUser?._id && (
                                                        <button
                                                            onClick={() => openDeleteConfirm(u._id, u.name)}
                                                            className="p-1.5 px-2 border border-rose-150 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition cursor-pointer"
                                                            title="Remove User"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create / Edit Modal */}
            {modalOpen && (
                <div id="user-form-modal" className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-150 bg-slate-50">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-teal-600" />
                                <span>{editingId ? "Revise User Credentials" : "Register New System User"}</span>
                            </h3>
                            <button
                                id="close-user-modal-btn"
                                type="button"
                                title="Close"
                                onClick={closeAndResetForm}
                                className="text-slate-400 hover:text-slate-700 transition p-1 hover:bg-slate-100 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form id="user-modal-form" onSubmit={handleSave} className="p-6 space-y-5">
                            {error && (
                                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-mono flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Full Legal Name</label>
                                <input
                                    id="user-input-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. John Smith"
                                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Corporate Email Address</label>
                                <input
                                    id="user-input-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                    placeholder="e.g. jsmith@tgh.com"
                                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    required
                                />
                            </div>

                            {/* Password (only for new user) */}
                            {!editingId && (
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">Initial Credential Password</label>
                                    <input
                                        id="user-input-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter initial password"
                                        className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                        required={!editingId}
                                    />
                                </div>
                            )}

                            {/* Role */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">System Access Level</label>
                                <select
                                    id="user-input-role"
                                    value={role}
                                    title="System Access Level"
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="block w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                >
                                    <option value="User">Standard User (Read-Only)</option>
                                    {canAssignAdminRoles && (
                                        <>
                                            <option value="Admin">Admin (Limited Administration)</option>
                                            <option value="SuperAdmin">Super Admin (Full System Control)</option>
                                        </>
                                    )}
                                </select>
                                {!canAssignAdminRoles && (
                                    <p className="text-[10px] text-slate-400 mt-1 font-mono">Contact Super Admin for elevated role assignments.</p>
                                )}
                            </div>

                            {/* Active Status */}
                            <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-150">
                                <input
                                    id="user-input-status"
                                    type="checkbox"
                                    checked={activeStatus}
                                    onChange={(e) => setActiveStatus(e.target.checked)}
                                    className="h-4 w-4 accent-teal-500 rounded bg-white border-slate-200"
                                    title="Account Status"
                                />
                                <div>
                                    <span className="block text-xs font-bold text-slate-700">Account Active</span>
                                    <span className="text-[10px] text-slate-450 font-mono">Suspended accounts cannot sign in or access system features.</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-150 mt-6 bg-slate-50 -mx-6 -mb-6 p-6">
                                <button
                                    id="cancel-user-form-btn"
                                    type="button"
                                    onClick={closeAndResetForm}
                                    className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl transition cursor-pointer"
                                >
                                    Discard Changes
                                </button>
                                <button
                                    id="save-user-form-btn"
                                    type="submit"
                                    className="px-5 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-teal-500/10 cursor-pointer"
                                >
                                    {editingId ? "Save Modifications" : "Register User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && deleteTarget && (
                <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                                <Trash2 className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Confirm User Removal</h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    This action will permanently delete user <span className="font-mono font-bold text-rose-700">"{deleteTarget.name}"</span> from the system. This cannot be undone.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-150">
                            <button
                                onClick={() => { setDeleteConfirmOpen(false); setDeleteTarget(null); }}
                                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-600 rounded-xl transition cursor-pointer"
                            >
                                Safely Abort
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-5 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold text-xs rounded-xl hover:opacity-95 shadow-md shadow-rose-500/10 cursor-pointer"
                            >
                                Confirm Deletion
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}