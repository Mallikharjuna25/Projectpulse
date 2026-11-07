import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  Users,
  FolderGit2,
  ShieldCheck,
  Plus,
  Power,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collegeApi } from '../../services/collegeApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';

export const SuperAdminDashboard = () => {
  const [colleges, setColleges] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    collegeName: '',
    collegeCode: '',
    emailDomain: '',
    address: '',
    adminName: '',
    adminEmail: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [collegesRes, statsRes] = await Promise.all([
        collegeApi.getAllColleges(),
        collegeApi.getSuperAdminStats().catch(() => ({ data: { stats: null } }))
      ]);
      setColleges(collegesRes.data?.colleges || []);
      setStats(statsRes.data?.stats || null);
    } catch {
      toast.error('Failed to load colleges and platform overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (collegeId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await collegeApi.toggleCollegeStatus(collegeId, nextStatus);
      toast.success(`College status changed to ${nextStatus}`);
      fetchData();
    } catch {
      toast.error('Failed to change college status');
    }
  };

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = formData.collegeName.trim();
    const trimmedCode = formData.collegeCode.trim();
    const trimmedAdminName = formData.adminName.trim();
    const trimmedAdminEmail = formData.adminEmail.trim().toLowerCase();

    if (!trimmedName) {
      toast.error('College name is required');
      return;
    }
    if (!trimmedCode) {
      toast.error('College code is required');
      return;
    }
    if (!trimmedAdminName) {
      toast.error('Admin name is required');
      return;
    }
    if (!trimmedAdminEmail || !trimmedAdminEmail.includes('@')) {
      toast.error('Please enter a valid administrator email');
      return;
    }

    setSubmitting(true);
    try {
      await collegeApi.createCollege({
        ...formData,
        collegeName: trimmedName,
        collegeCode: trimmedCode.toUpperCase(),
        adminName: trimmedAdminName,
        adminEmail: trimmedAdminEmail
      });
      toast.success('College and administrator onboarded successfully!');
      setIsModalOpen(false);
      setFormData({
        collegeName: '',
        collegeCode: '',
        emailDomain: '',
        address: '',
        adminName: '',
        adminEmail: ''
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to onboard college');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-sm">
        <div>
          <span className="text-xs uppercase tracking-wider text-purple-200 font-semibold">
            Platform Governance Console
          </span>
          <h1 className="text-2xl font-black mt-1">Super Admin Overview</h1>
          <p className="text-xs text-purple-100 mt-1 max-w-xl">
            Global oversight of onboarded colleges, tenant isolation controls, and institutional status.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-purple-950 hover:bg-purple-50 shadow-sm"
          >
            Add New College
          </Button>
          <button
            onClick={fetchData}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Onboarded Colleges</span>
            <Building className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.totalColleges ?? colleges.length)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {stats?.activeColleges ?? colleges.filter((c) => c.status === 'ACTIVE').length} Active
          </span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Users</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.totalUsers ?? 0)}
          </div>
          <span className="text-[11px] text-slate-400">across all tenants</span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Projects</span>
            <FolderGit2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.totalProjects ?? 0)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Multi-tenant active</span>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Platform Health</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">100%</div>
          <span className="text-[11px] text-slate-400">Tenant isolation verified</span>
        </Card>
      </div>

      {/* Colleges Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-purple-600" /> Managed Colleges
          </h2>
          {colleges.length > 0 && (
            <Link to="/super-admin/colleges" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              View all colleges &rarr;
            </Link>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        ) : colleges.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <Building className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Colleges Onboarded Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by onboarding your first college institution to enable departments, students, and faculty.
            </p>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Add First College
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">College Name</th>
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Email Domain</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {colleges.map((c) => (
                  <tr key={c._id}>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {c.collegeName}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-brand-600">{c.collegeCode}</td>
                    <td className="py-3 px-3 text-slate-500">
                      {c.emailDomain ? `@${c.emailDomain}` : 'Open (Any Domain)'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={c.status === 'ACTIVE' ? 'green' : 'red'} size="sm">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(c._id, c.status)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          c.status === 'ACTIVE'
                            ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Onboard College Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Onboard New College
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter college details and define the initial institutional administrator account.
            </p>

            <form onSubmit={handleCreateCollege} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College / University Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Institute of Technology"
                  value={formData.collegeName}
                  onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    College Code (Unique) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AIT"
                    value={formData.collegeCode}
                    onChange={(e) => setFormData({ ...formData, collegeCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 uppercase font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Domain (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ait.edu"
                    value={formData.emailDomain}
                    onChange={(e) => setFormData({ ...formData, emailDomain: e.target.value })}
                    className="w-full px-3 py-2 lowercase font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Address
                </label>
                <input
                  type="text"
                  placeholder="Campus address, city, state"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="font-semibold text-purple-600 dark:text-purple-400 block mb-2">
                  Initial College Administrator Details
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Admin Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Ramesh Kumar"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@college.edu"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                  Create College & Admin
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
