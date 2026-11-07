import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  FileSpreadsheet,
  Download,
  KeyRound
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userManagementApi } from '../../services/userManagementApi.js';
import { departmentApi } from '../../services/departmentApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { LoadingSpinner } from '../../components/common/LoadingSpinner.jsx';

export const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  // Modals
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Single student form
  const [singleForm, setSingleForm] = useState({
    name: '',
    email: '',
    departmentId: '',
    rollNumber: '',
    academicYear: '4th',
    section: 'A'
  });

  // Bulk Import state
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await userManagementApi.listUsers({
        role: 'STUDENT',
        departmentId: departmentFilter || undefined,
        isActive: statusFilter ? statusFilter === 'ACTIVE' : undefined,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit
      });
      setStudents(res.data?.users || []);
      if (res.data?.pagination) {
        setPagination(res.data.pagination);
      }
    } catch {
      toast.error('Failed to load students');
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
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [departmentFilter, statusFilter, pagination.page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleToggleStatus = async (student) => {
    const nextStatus = !student.isActive;
    try {
      await userManagementApi.toggleUserStatus(student._id, nextStatus);
      toast.success(`Account for ${student.name} ${nextStatus ? 'activated' : 'deactivated'}`);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleResetPassword = async (student) => {
    try {
      const res = await userManagementApi.adminResetPassword(student._id);
      toast.success(`Password reset token: ${res.data?.resetToken || 'Sent to student'}`);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    }
  };

  const handleCreateSingleStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userManagementApi.createStudent(singleForm);
      toast.success('Student account created successfully!');
      setIsSingleModalOpen(false);
      setSingleForm({
        name: '',
        email: '',
        departmentId: '',
        rollNumber: '',
        academicYear: '4th',
        section: 'A'
      });
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  // Parse CSV text into preview rows
  const handleParseCsv = (text) => {
    setCsvText(text);
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      setParsedRows([]);
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      const item = {};
      headers.forEach((h, idx) => {
        item[h] = values[idx] || '';
      });
      rows.push(item);
    }
    setParsedRows(rows);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleParseCsv(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleConfirmBulkImport = async () => {
    if (!parsedRows.length) return;
    setSubmitting(true);
    try {
      const res = await userManagementApi.bulkImportStudents({ students: parsedRows });
      setBulkResult(res.data);
      toast.success(res.message || 'Bulk import completed');
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Import failed');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,name,email,rollNumber,departmentCode,academicYear,section\n' +
      'Aarav Sharma,aarav.sharma@ait.edu,AIT-CSE-101,CSE,4th,A\n' +
      'Pooja Nair,pooja.nair@ait.edu,AIT-IT-102,IT,3rd,B\n' +
      'Rohan Gupta,rohan.gupta@ait.edu,AIT-CSE-103,CSE,4th,A\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'projectpulse_students_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-600" /> Student Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View, enroll, and manage student accounts across all departments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Upload}
            onClick={() => {
              setBulkResult(null);
              setIsBulkModalOpen(true);
            }}
          >
            Bulk CSV Import
          </Button>
          <Button size="sm" icon={Plus} onClick={() => setIsSingleModalOpen(true)}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>

            <Button type="submit" size="sm">Search</Button>
          </div>
        </form>
      </Card>

      {/* Students Table */}
      <Card>
        {loading ? (
          <div className="py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No students found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Year / Sec</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-600">
                      {st.rollNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{st.email}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {st.departmentId?.name || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {st.academicYear || '—'} · Sec {st.section || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={st.isActive ? 'green' : 'red'} size="sm">
                        {st.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleResetPassword(st)}
                          className="p-1.5 text-slate-400 hover:text-brand-600 rounded"
                          title="Generate reset link"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <Button
                          variant={st.isActive ? 'secondary' : 'primary'}
                          size="sm"
                          onClick={() => handleToggleStatus(st)}
                          className="text-xs py-1 px-2.5"
                        >
                          {st.isActive ? 'Deactivate' : 'Activate'}
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

      {/* Add Single Student Modal */}
      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 relative">
            <button
              type="button"
              onClick={() => setIsSingleModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Add New Student
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Enter student credentials. Initial default password is set to <code>Password@123</code>.
            </p>

            <form onSubmit={handleCreateSingleStudent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={singleForm.name}
                  onChange={(e) => setSingleForm({ ...singleForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Institutional Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={singleForm.email}
                  onChange={(e) => setSingleForm({ ...singleForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department *
                  </label>
                  <select
                    required
                    value={singleForm.departmentId}
                    onChange={(e) => setSingleForm({ ...singleForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                    Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CSE-2026-001"
                    value={singleForm.rollNumber}
                    onChange={(e) => setSingleForm({ ...singleForm, rollNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 uppercase font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={singleForm.academicYear}
                    onChange={(e) => setSingleForm({ ...singleForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                    <option value="PG">Postgraduate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    placeholder="A"
                    value={singleForm.section}
                    onChange={(e) => setSingleForm({ ...singleForm, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button variant="secondary" size="sm" onClick={() => setIsSingleModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={submitting}>
                  Create Student
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Bulk Import CSV Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Bulk CSV Student Roster Import
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Upload a CSV file containing your student enrollment list.
            </p>

            {/* Template Download & File Picker */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-4 text-xs">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Need the template?
                </span>
                <span className="text-[11px] text-slate-500">
                  Headers: name, email, rollNumber, departmentCode, academicYear, section
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={downloadSampleCsv}
              >
                Download Sample CSV
              </Button>
            </div>

            {/* File Upload Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Choose CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
            </div>

            {/* Preview Table */}
            {parsedRows.length > 0 && !bulkResult && (
              <div className="mb-4">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 block mb-2">
                  Preview ({parsedRows.length} students detected):
                </span>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px]">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Roll No</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Dept Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{row.name}</td>
                          <td className="p-2 font-mono">{row.rollNumber}</td>
                          <td className="p-2 text-slate-500">{row.email}</td>
                          <td className="p-2 font-mono">{row.departmentCode}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 5 && (
                    <div className="p-2 text-center text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800/40">
                      + {parsedRows.length - 5} more rows...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Result Summary Banner */}
            {bulkResult && (
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 mb-4 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Import Complete: {bulkResult.createdCount} accounts created
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Processed: {bulkResult.totalProcessed} | Created: {bulkResult.createdCount} | Skipped: {bulkResult.skippedCount}
                </p>

                {bulkResult.skippedRows?.length > 0 && (
                  <div className="mt-3 p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] max-h-32 overflow-y-auto">
                    <span className="font-semibold text-rose-600 block mb-1">Skipped Rows:</span>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                      {bulkResult.skippedRows.map((s, idx) => (
                        <li key={idx}>
                          Row {s.row} ({s.rollNumber || s.email}): {s.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setIsBulkModalOpen(false)}>
                Close
              </Button>
              {!bulkResult && (
                <Button
                  size="sm"
                  loading={submitting}
                  disabled={!parsedRows.length}
                  onClick={handleConfirmBulkImport}
                >
                  Confirm & Import ({parsedRows.length})
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

