import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Building, Plus, Search, Filter, Power, AlertCircle, X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { collegeApi } from '../../services/collegeApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';

export const CollegesListPage = ({ defaultOpenModal = false }) => {
  const location = useLocation();
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const shouldOpen = defaultOpenModal || location.pathname.endsWith('/new') || location.search.includes('new=true');
  const [isModalOpen, setIsModalOpen] = useState(shouldOpen);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    collegeName: '',
    collegeCode: '',
    emailDomain: '',
    address: '',
    adminName: '',
    adminEmail: ''
  });

  const fetchColleges = async () => {
    try {
      const res = await collegeApi.getAllColleges();
      setColleges(res.data?.colleges || []);
    } catch {
      toast.error('Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleToggleStatus = async (collegeId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await collegeApi.toggleCollegeStatus(collegeId, nextStatus);
      toast.success(`College status set to ${nextStatus}`);
      fetchColleges();
    } catch {
      toast.error('Failed to update college status');
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
      fetchColleges();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create college');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredColleges = colleges.filter((c) => {
    const matchesSearch =
      c.collegeName.toLowerCase().includes(search.toLowerCase()) ||
      c.collegeCode.toLowerCase().includes(search.toLowerCase()) ||
      (c.emailDomain && c.emailDomain.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" /> Managed Colleges
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-tenant institutions onboarded to the ProjectPulse network.
          </p>
        </div>

        <Button
          size="sm"
          icon={Plus}
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Add New College
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by college name, code (e.g. AIT), or email domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="SUSPENDED">Suspended Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Colleges List Table */}
      <Card>
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredColleges.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No colleges match your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">College Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Domain Rule</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Users</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredColleges.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {c.collegeName}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600 dark:text-purple-400">
                      {c.collegeCode}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {c.emailDomain ? (
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          @{c.emailDomain}
                        </span>
                      ) : (
                        <span className="text-slate-400">Open Domain</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {c.address || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {c.stats?.totalUsers ?? '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={c.status === 'ACTIVE' ? 'green' : 'red'} size="sm">
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant={c.status === 'ACTIVE' ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => handleToggleStatus(c._id, c.status)}
                        className="text-xs py-1 px-2.5"
                      >
                        {c.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add College Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Onboard New College
            </h2>
            <p className="text-xs text-slate-500 mb-4">
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
                  Address
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

