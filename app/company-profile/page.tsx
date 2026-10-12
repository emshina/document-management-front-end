'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { apiCall } from '@/lib/api';
import { fetchTenantBranding, getLogoUrl } from '@/lib/tenantBranding';
import { 
  Building2, 
  Save, 
  Upload, 
  Sparkles, 
  Loader2, 
  Menu, 
  CreditCard, 
  Users, 
  UserPlus, 
  Mail,
  Shield, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  Edit2
} from 'lucide-react';

interface PlanData {
  id: string | number;
  name: string;
  price?: number;
  allow_sub_companies?: boolean;
  max_sub_companies?: number;
}

interface UserItem {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  is_active: boolean;
  is_staff: boolean;
  tenant?: string | number;
}

interface UserRoleItem {
  id: string | number;
  user: string | number;
  user_email?: string;
  role: string | number;
  role_name?: string;
}

interface PermissionItem {
  id: string | number;
  code: string;
  name: string;
  description?: string;
}

interface RoleItem {
  id: string | number;
  name: string;
  tenant?: string | number;
  tenant_name?: string;
  permissions?: PermissionItem[];
  created_at?: string;
}

interface InvitationItem {
  id: string | number;
  email: string;
  role_name?: string;
  is_accepted: boolean;
  expires_at?: string;
  created_at?: string;
}

export default function CompanyProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'roles' | 'invitations' | 'billing'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Tenant State
  const [tenantId, setTenantId] = useState<string | number>('');
  const [companyName, setCompanyName] = useState('Visaro Server');
  const [primaryColor, setPrimaryColor] = useState('#2D1B4E');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Plans State
  const [currentPlan, setCurrentPlan] = useState<PlanData | null>(null);
  const [availablePlans, setAvailablePlans] = useState<PlanData[]>([]);

  // Users, Roles, Permissions, Mappings & Invitations State
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [userRolesList, setUserRolesList] = useState<UserRoleItem[]>([]);
  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [permissionsList, setPermissionsList] = useState<PermissionItem[]>([]);
  const [invitationsList, setInvitationsList] = useState<InvitationItem[]>([]);
  
  // Invitation Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoleId, setInviteRoleId] = useState('');
  const [inviteExpiresAt, setInviteExpiresAt] = useState('');

  // Role Create / Edit Modal State
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | number | null>(null);
  const [roleName, setRoleName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<(string | number)[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const branding = await fetchTenantBranding();
      if (branding) {
        if (branding.id) setTenantId(branding.id);
        setCompanyName(branding.name);
        setPrimaryColor(branding.effective_primary_color || '#2D1B4E');
        if (branding.effective_logo) {
          setLogoPreview(getLogoUrl(branding.effective_logo));
        }
      }

      const tenantData = await apiCall('/v1/tenants/tenants/current/', { requiresAuth: true });
      const tenantObj = Array.isArray(tenantData) ? tenantData[0] : tenantData?.results?.[0] || tenantData;
      if (tenantObj && tenantObj.plan) {
        setCurrentPlan(tenantObj.plan);
      }

      const plansData = await apiCall('/v1/tenants/plans/', { requiresAuth: true });
      if (plansData) {
        setAvailablePlans(Array.isArray(plansData) ? plansData : plansData.results || []);
      }

      const usersData = await apiCall('/v1/accounts/users/', { requiresAuth: true });
      if (usersData) {
        setUsersList(Array.isArray(usersData) ? usersData : usersData.results || []);
      }

      const userRolesData = await apiCall('/v1/accounts/user-roles/', { requiresAuth: true });
      if (userRolesData) {
        setUserRolesList(Array.isArray(userRolesData) ? userRolesData : userRolesData.results || []);
      }

      const rolesData = await apiCall('/v1/accounts/roles/', { requiresAuth: true });
      if (rolesData) {
        const fetchedRoles = Array.isArray(rolesData) ? rolesData : rolesData.results || [];
        setRolesList(fetchedRoles);
        if (fetchedRoles.length > 0) setInviteRoleId(fetchedRoles[0].id);
      }

      const permissionsData = await apiCall('/v1/accounts/permissions/', { requiresAuth: true });
      if (permissionsData) {
        setPermissionsList(Array.isArray(permissionsData) ? permissionsData : permissionsData.results || []);
      }

      const invitationsData = await apiCall('/v1/accounts/invitations/', { requiresAuth: true });
      if (invitationsData) {
        setInvitationsList(Array.isArray(invitationsData) ? invitationsData : invitationsData.results || []);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setErrorMessage('Failed to load company profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteExpiresAt) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await apiCall('/v1/accounts/invitations/', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRoleId,
          tenant: tenantId,
          expires_at: inviteExpiresAt,
        }),
      });

      setSuccessMessage(`Invitation sent successfully to ${inviteEmail}.`);
      setInviteEmail('');
      setInviteExpiresAt('');
      setIsInviteModalOpen(false);
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send invitation.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateRoleModal = () => {
    setEditingRoleId(null);
    setRoleName('');
    setSelectedPermissionIds([]);
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRoleModal = (role: RoleItem) => {
    setEditingRoleId(role.id);
    setRoleName(role.name);
    const existingIds = role.permissions ? role.permissions.map(p => p.id) : [];
    setSelectedPermissionIds(existingIds);
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName) return;

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const endpoint = editingRoleId 
        ? `/v1/accounts/roles/${editingRoleId}/` 
        : '/v1/accounts/roles/';
      const method = editingRoleId ? 'PUT' : 'POST';

      await apiCall(endpoint, {
        method,
        requiresAuth: true,
        body: JSON.stringify({
          name: roleName,
          tenant: tenantId,
          permission_ids: selectedPermissionIds,
        }),
      });

      setSuccessMessage(editingRoleId ? `Role "${roleName}" updated successfully.` : `Role "${roleName}" created successfully.`);
      setRoleName('');
      setSelectedPermissionIds([]);
      setEditingRoleId(null);
      setIsRoleModalOpen(false);
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save role.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string | number) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    setSuccessMessage('');
    setErrorMessage('');

    try {
      await apiCall(`/v1/accounts/users/${userId}/`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      setUsersList(usersList.filter(u => u.id !== userId));
      setSuccessMessage('User removed successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Company administrators cannot be deleted.');
    }
  };

  const handleDeleteRole = async (roleId: string | number) => {
    if (!confirm('Are you sure you want to delete this role?')) return;

    setSuccessMessage('');
    setErrorMessage('');

    try {
      await apiCall(`/v1/accounts/roles/${roleId}/`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      setRolesList(rolesList.filter(r => r.id !== roleId));
      setSuccessMessage('Role deleted successfully.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete role.');
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) {
      setErrorMessage('Tenant ID not found.');
      return;
    }

    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('primary_color', primaryColor);
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
      const endpoint = `${apiBase.replace(/\/$/, '')}/v1/tenants/tenants/${tenantId}/`;

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || JSON.stringify(errorData) || 'Failed to update branding.');
      }

      setSuccessMessage('Company logo and theme color updated successfully!');
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update company branding.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectPlan = async (planId: string | number) => {
    if (!tenantId) return;
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await apiCall(`/v1/tenants/tenants/${tenantId}/`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({ plan_id: planId }),
      });

      setSuccessMessage('Subscription plan updated successfully!');
      loadAllData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to change subscription plan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpenAllFeatures={() => {}} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 md:hidden">
          <div className="flex items-center gap-2.5">
            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 rounded-lg text-gray-800 hover:bg-gray-100">
              <Menu size={20} />
            </button>
            <span className="font-bold text-black text-sm">Company Settings</span>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-6 space-y-4">
          <div>
            <h1 className="text-2xl font-black text-black tracking-tight">Company Management</h1>
            <p className="text-xs text-black font-medium mt-0.5">Manage visual branding, team users, roles, permissions, and billing tiers.</p>
          </div>

          {successMessage && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Navigation Tabs using dynamic primaryColor for active state */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            {[
              { id: 'general', label: 'Logo & Color Theme', icon: Building2 },
              { id: 'users', label: 'Users & Permissions', icon: Users },
              { id: 'roles', label: 'Roles & Access', icon: Shield },
              { id: 'invitations', label: 'Invitations', icon: Mail },
              { id: 'billing', label: 'Plans & Billing', icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setSuccessMessage(''); setErrorMessage(''); }}
                  style={isActive ? { backgroundColor: primaryColor } : {}}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    isActive 
                      ? 'text-white shadow-sm' 
                      : 'bg-white text-black hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              
              {/* TAB 1: LOGO & COLOR THEME */}
              {activeTab === 'general' && (
                <form onSubmit={handleSaveBranding} className="space-y-5 max-w-xl">
                  <div>
                    <h2 className="text-base font-bold text-black">Visual Identity & Theme</h2>
                    <p className="text-xs text-black font-medium">Update your company logo and primary sidebar color theme.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-black">Company Name (Locked)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                        <Building2 size={16} />
                      </div>
                      <input 
                        type="text"
                        value={companyName}
                        disabled
                        className="w-full pl-10 pr-3.5 py-2 bg-gray-100 border border-gray-300 rounded-xl text-black font-medium text-xs cursor-not-allowed select-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-black">Brand Primary Color (Sidebar Theme)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-9 rounded-lg cursor-pointer border border-gray-300 p-1 bg-white"
                      />
                      <input 
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-32 px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-black font-bold text-xs font-mono focus:ring-2 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-black">Company Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Sparkles className="text-black" size={20} />
                        )}
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-black font-bold text-xs shadow-sm transition">
                        <Upload size={14} />
                        <span>Upload New Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save size={15} />}
                      <span>Save Branding</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: USERS & PERMISSIONS */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-black">User Access & Permissions</h2>
                      <p className="text-xs text-black font-medium">Manage team members, roles, and send invitations.</p>
                    </div>
                    <button 
                      onClick={() => setIsInviteModalOpen(true)}
                      style={{ backgroundColor: primaryColor }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition hover:opacity-90"
                    >
                      <UserPlus size={14} />
                      <span>Invite User</span>
                    </button>
                  </div>

                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 text-[11px] font-bold text-black uppercase tracking-wider">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Role Type</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-xs font-medium">
                        {usersList.length > 0 ? (
                          usersList.map((user) => {
                            const assignedRole = userRolesList.find((ur) => String(ur.user) === String(user.id));
                            const roleName = assignedRole?.role_name || (user.is_staff ? 'Administrator' : 'Standard Member');
                            const isAdmin = user.is_staff || roleName === 'Administrator';

                            return (
                              <tr key={user.id} className="hover:bg-gray-50 transition">
                                <td className="px-4 py-3 font-bold text-black">
                                  {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User'}
                                </td>
                                <td className="px-4 py-3 text-black font-medium">{user.email}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    user.is_active ? 'bg-emerald-100 text-emerald-900' : 'bg-gray-200 text-black'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-600' : 'bg-gray-600'}`} />
                                    {user.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-100 text-purple-900">
                                    {roleName}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  {!isAdmin ? (
                                    <button 
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Remove User"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-gray-400 italic">Protected</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-black font-semibold">No users found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Invite User Modal */}
                  {isInviteModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
                        <h3 className="text-sm font-bold text-black">Invite New Team Member</h3>
                        <form onSubmit={handleSendInvitation} className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">Email Address</label>
                            <input 
                              type="email" 
                              required
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="colleague@company.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black font-medium focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">Assign Role</label>
                            <select 
                              value={inviteRoleId}
                              onChange={(e) => setInviteRoleId(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black font-medium bg-white"
                            >
                              {rolesList.map((role) => (
                                <option key={role.id} value={role.id}>{role.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">Expiration Date & Time</label>
                            <input 
                              type="datetime-local" 
                              required
                              value={inviteExpiresAt}
                              onChange={(e) => setInviteExpiresAt(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black font-medium bg-white focus:ring-2"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button 
                              type="button"
                              onClick={() => setIsInviteModalOpen(false)}
                              className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs text-black font-bold hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              disabled={saving}
                              style={{ backgroundColor: primaryColor }}
                              className="px-3.5 py-1.5 text-white rounded-xl text-xs font-bold shadow hover:opacity-90"
                            >
                              {saving ? 'Sending...' : 'Send Invitation'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ROLES & ACCESS */}
              {activeTab === 'roles' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-black">Company Roles & Permissions</h2>
                      <p className="text-xs text-black font-medium">Create and edit roles with module-based permissions.</p>
                    </div>
                    <button 
                      onClick={handleOpenCreateRoleModal}
                      style={{ backgroundColor: primaryColor }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition hover:opacity-90"
                    >
                      <Plus size={14} />
                      <span>Create Role</span>
                    </button>
                  </div>

                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 text-[11px] font-bold text-black uppercase tracking-wider">
                          <th className="px-4 py-3">Role Name</th>
                          <th className="px-4 py-3">Assigned Permissions</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-xs font-medium">
                        {rolesList.length > 0 ? (
                          rolesList.map((role) => (
                            <tr key={role.id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3 font-bold text-black">{role.name}</td>
                              <td className="px-4 py-3 text-black font-medium">
                                <div className="flex flex-wrap gap-1 max-w-lg">
                                  {role.permissions && role.permissions.length > 0 ? (
                                    role.permissions.map((perm) => (
                                      <span key={perm.id} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-black border border-gray-200">
                                        {perm.name || perm.code}
                                      </span>
                                    ))
                                  ) : (
                                    <span className="text-gray-400 italic">No permissions assigned</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                {role.name !== 'Administrator' ? (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button 
                                      onClick={() => handleOpenEditRoleModal(role)}
                                      className="p-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                      title="Edit Role"
                                    >
                                      <Edit2 size={15} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteRole(role.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                      title="Delete Role"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-semibold text-gray-400 italic">Protected</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center py-8 text-black font-semibold">No roles found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Create / Edit Role Modal with Grouped Permissions */}
                  {isRoleModalOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div>
                          <h3 className="text-base font-bold text-black">
                            {editingRoleId ? 'Edit Custom Role' : 'Create Custom Role'}
                          </h3>
                          <p className="text-xs text-black font-medium">Group permissions by module to assign access quickly.</p>
                        </div>

                        <form onSubmit={handleSaveRole} className="space-y-4">
                          <div>
                            <label className="block text-[11px] font-bold text-black mb-1">Role Name</label>
                            <input 
                              type="text" 
                              required
                              value={roleName}
                              onChange={(e) => setRoleName(e.target.value)}
                              placeholder="e.g. Finance Manager"
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black font-medium focus:ring-2"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-black mb-2">Module Permissions</label>
                            <div className="border border-gray-300 rounded-xl p-4 max-h-72 overflow-y-auto space-y-4 bg-gray-50">
                              {Object.entries(
                                permissionsList.reduce((acc: Record<string, PermissionItem[]>, perm) => {
                                  const parts = perm.name.split(' ');
                                  const moduleName = parts.slice(2).join(' ') || 'General';
                                  const formattedModule = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
                                  if (!acc[formattedModule]) acc[formattedModule] = [];
                                  acc[formattedModule].push(perm);
                                  return acc;
                                }, {})
                              ).map(([module, perms]) => {
                                const modulePermIds = perms.map(p => p.id);
                                const allSelected = modulePermIds.every(id => selectedPermissionIds.includes(id));

                                return (
                                  <div key={module} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm space-y-2">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                      <span className="text-xs font-black text-black uppercase tracking-wider">{module}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (allSelected) {
                                            setSelectedPermissionIds(selectedPermissionIds.filter(id => !modulePermIds.includes(id)));
                                          } else {
                                            const combined = Array.from(new Set([...selectedPermissionIds, ...modulePermIds]));
                                            setSelectedPermissionIds(combined);
                                          }
                                        }}
                                        className="text-[10px] font-bold text-indigo-600 hover:underline"
                                      >
                                        {allSelected ? 'Deselect All' : 'Select All'}
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {perms.map((perm) => {
                                        const isChecked = selectedPermissionIds.includes(perm.id);
                                        return (
                                          <label key={perm.id} className="flex items-center gap-2 text-xs text-black font-medium cursor-pointer">
                                            <input 
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setSelectedPermissionIds([...selectedPermissionIds, perm.id]);
                                                } else {
                                                  setSelectedPermissionIds(selectedPermissionIds.filter(id => id !== perm.id));
                                                }
                                              }}
                                              className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="truncate">{perm.name.replace(/^Can\s+\w+\s+/i, '')}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <button 
                              type="button"
                              onClick={() => setIsRoleModalOpen(false)}
                              className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs text-black font-bold hover:bg-gray-100"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit"
                              disabled={saving}
                              style={{ backgroundColor: primaryColor }}
                              className="px-4 py-2 text-white rounded-xl text-xs font-bold shadow hover:opacity-90"
                            >
                              {saving ? 'Saving...' : (editingRoleId ? 'Update Role' : 'Save Role')}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: INVITATIONS */}
              {activeTab === 'invitations' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-black">Team Invitations</h2>
                      <p className="text-xs text-black font-medium">Monitor active and accepted email invitations.</p>
                    </div>
                    <button 
                      onClick={() => setIsInviteModalOpen(true)}
                      style={{ backgroundColor: primaryColor }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-white rounded-xl text-xs font-bold shadow-sm transition hover:opacity-90"
                    >
                      <UserPlus size={14} />
                      <span>Invite User</span>
                    </button>
                  </div>

                  <div className="border border-gray-300 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-300 text-[11px] font-bold text-black uppercase tracking-wider">
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Expires At</th>
                          <th className="px-4 py-3">Sent At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-xs font-medium">
                        {invitationsList.length > 0 ? (
                          invitationsList.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3 font-bold text-black">{inv.email}</td>
                              <td className="px-4 py-3 text-black font-medium">{inv.role_name || 'Standard'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.is_accepted ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${inv.is_accepted ? 'bg-emerald-600' : 'bg-amber-600'}`} />
                                  {inv.is_accepted ? 'Accepted' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-black font-medium">
                                {inv.expires_at ? new Date(inv.expires_at).toLocaleString() : 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-black font-medium">
                                {inv.created_at ? new Date(inv.created_at).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-black font-semibold">No invitations found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: PLANS & BILLING */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-black">Plans & Subscription</h2>
                    <p className="text-xs text-black font-medium">Manage your active subscription plan or switch tiers.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {availablePlans.length > 0 ? (
                      availablePlans.map((plan) => {
                        const isCurrent = currentPlan?.id === plan.id;
                        return (
                          <div 
                            key={plan.id}
                            style={isCurrent ? { borderColor: primaryColor } : {}}
                            className={`rounded-xl p-5 flex flex-col justify-between relative transition ${
                              isCurrent 
                                ? 'border-2 shadow-md bg-opacity-5' 
                                : 'border border-gray-300 bg-white'
                            }`}
                          >
                            {isCurrent && (
                              <span 
                                style={{ backgroundColor: primaryColor }}
                                className="absolute -top-2.5 right-4 text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                              >
                                Current Plan
                              </span>
                            )}
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Tier</span>
                              <div className="text-lg font-black text-black mt-0.5">{plan.name}</div>
                              <div className="text-xl font-bold text-black mt-2">${plan.price ?? '0'} <span className="text-[11px] font-medium text-black">/mo</span></div>
                              <ul className="mt-3 space-y-1.5 text-xs text-black font-medium">
                                <li>✓ Sub-companies: {plan.allow_sub_companies ? `${plan.max_sub_companies || 'Allowed'}` : 'Not Supported'}</li>
                              </ul>
                            </div>

                            <button 
                              onClick={() => handleSelectPlan(plan.id)}
                              disabled={isCurrent || saving}
                              style={isCurrent ? { backgroundColor: primaryColor } : {}}
                              className={`mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition ${
                                isCurrent 
                                  ? 'text-white opacity-90 cursor-default' 
                                  : 'border border-gray-300 hover:bg-gray-100 text-black'
                              }`}
                            >
                              {isCurrent ? 'Active Plan' : 'Select Plan'}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="col-span-3 text-center py-8 text-xs text-black font-bold">
                        No subscription plans available.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}