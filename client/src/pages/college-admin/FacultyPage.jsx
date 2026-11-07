import React, { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, KeyRound, X, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { userManagementApi } from '../../services/userManagementApi.js';
import { departmentApi } from '../../services/departmentApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';

export const FacultyPage = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    departmentId: '',
    designation: 'Assistant Professor',
    maxSupervisionCapacity: 5
  });

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const res = await userManagementApi.listUsers({ role: 'FACULTY' });
      setFacultyList(res.data?.users || []);
    } catch {
      toast.error('Failed to load faculty directory');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentApi.listDepartments();
      setDepartments(res.data?.departments || []);
    } catch {
      toast.error('Failed to load departments');
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  const handleToggleStatus = async (faculty) => {
    const nextStatus = !faculty.isActive;
    try {
      await userManagementApi.toggleUserStatus(faculty._id, nextStatus);
      toast.success(`Account for ${faculty.name} ${nextStatus ? 'activated' : 'deactivated'}`);
      fetchFaculty();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (faculty) => {
    try {
      const res = await userManagementApi.adminResetPassword(faculty._id);
      toast.success(`Password reset token: ${res.data?.resetToken || 'Sent to faculty'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userManagementApi.createFaculty({
        ...formData,
        maxSupervisionCapacity: parseInt(formData.maxSupervisionCapacity, 10)
      });
      toast.success('Faculty guide onboarded successfully!');
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        departmentId: '',
        designation: 'Assistant Professor',
        maxSupervisionCapacity: 5
      });
      fetchFaculty();
    } catch (err) {
      toast.error(err.message || 'Failed to create faculty member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" /> Faculty Guides
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage professors, designations, and student project supervision quotas.
          </p>
        </div>

        <Button size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Add Faculty Guide
        </Button>
      </div>

      {/* Faculty Table */}
      <Card>
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : facultyList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No faculty members found. Click "Add Faculty Guide" to onboard one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Faculty Name</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Supervision Quota</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {facultyList.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {f.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {f.designation || 'Assistant Professor'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{f.email}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {f.departmentId?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                      Max {f.maxSupervisionCapacity || 5} teams
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={f.isActive ? 'green' : 'red'} size="sm">
                        {f.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(f)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded"
                          title="Generate reset link"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <Button
                          variant={f.isActive ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(f)}
                          className="text-xs py-1 px-2.5"
                        >
                          {f.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Faculty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Add Faculty Guide
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter professor details. Default credentials will be set to <code>Password@123</code>.
            </p>

            <form onSubmit={handleCreateFaculty} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  College Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="faculty@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Select --</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <select
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor & HOD">Professor & HOD</option>
                    <option value="Adjunct Faculty">Adjunct Faculty</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supervision Capacity (Max Projects)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={formData.maxSupervisionCapacity}
                  onChange={(e) => setFormData({ ...formData, maxSupervisionCapacity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={submitting} className="bg-amber-600 hover:bg-amber-700 text-white">
                  Add Faculty
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

