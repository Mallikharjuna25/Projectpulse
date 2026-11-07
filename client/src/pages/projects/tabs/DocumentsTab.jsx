import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  History,
  Download,
  ExternalLink,
  Plus,
  X,
  MessageSquare,
  Filter,
  FileCheck,
  Eye
} from 'lucide-react';
import { documentApi } from '../../../services/documentApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'ALL', label: 'All Documents' },
  { id: 'PROPOSAL', label: 'Proposal' },
  { id: 'REQUIREMENTS', label: 'Requirements' },
  { id: 'DESIGN', label: 'Design' },
  { id: 'REPORT', label: 'Report' },
  { id: 'PRESENTATION', label: 'Presentation' },
  { id: 'FINAL_SUBMISSION', label: 'Final Submission' },
  { id: 'OTHER', label: 'Other' }
];

const STATUS_BADGES = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    icon: Clock
  },
  SUBMITTED: {
    label: 'Submitted for Review',
    bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    icon: Clock
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    icon: CheckCircle2
  },
  CHANGES_REQUESTED: {
    label: 'Changes Requested',
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    icon: AlertTriangle
  }
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const DocumentsTab = ({ projectId, project, currentUserRole, isLeader }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocForVersion, setSelectedDocForVersion] = useState(null);
  const [selectedDocForHistory, setSelectedDocForHistory] = useState(null);
  const [selectedDocForReview, setSelectedDocForReview] = useState(null);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('PROPOSAL');
  const [uploadNotes, setUploadNotes] = useState('');
  const [submitImmediately, setSubmitImmediately] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Version Form State
  const [versionFile, setVersionFile] = useState(null);
  const [versionNotes, setVersionNotes] = useState('');
  const [versionSubmitImmediately, setVersionSubmitImmediately] = useState(true);

  // Review Form State
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  const isFacultyGuide =
    project?.facultyGuideId &&
    (project.facultyGuideId._id === user?._id || project.facultyGuideId === user?._id);
  const canReview =
    isFacultyGuide || ['FACULTY', 'COLLEGE_ADMIN', 'REVIEWER', 'SUPER_ADMIN'].includes(user?.globalRole);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (activeCategory !== 'ALL') params.category = activeCategory;
      if (statusFilter) params.status = statusFilter;

      const res = await documentApi.listDocuments(projectId, params);
      setDocuments(res?.data?.documents || res?.documents || []);
    } catch (err) {
      toast.error('Failed to load project documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId, activeCategory, statusFilter]);

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle || uploadFile.name);
      formData.append('category', uploadCategory);
      formData.append('notes', uploadNotes);
      if (submitImmediately) {
        formData.append('status', 'SUBMITTED');
      }

      await documentApi.uploadDocument(projectId, formData);
      toast.success('Document uploaded successfully!');
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadNotes('');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!versionFile) {
      toast.error('Please select a file for the new revision');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('file', versionFile);
      formData.append('notes', versionNotes);
      formData.append('submitForReview', versionSubmitImmediately ? 'true' : 'false');

      await documentApi.uploadNewVersion(projectId, selectedDocForVersion._id, formData);
      toast.success('New revision uploaded successfully!');
      setSelectedDocForVersion(null);
      setVersionFile(null);
      setVersionNotes('');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload new revision');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async (doc) => {
    try {
      await documentApi.updateStatus(projectId, doc._id, { status: 'SUBMITTED' });
      toast.success('Document submitted for faculty review');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit document');
    }
  };

  const handleReviewDocument = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await documentApi.updateStatus(projectId, selectedDocForReview._id, {
        status: reviewDecision,
        reviewNotes: reviewNotes.trim()
      });
      toast.success(
        reviewDecision === 'APPROVED'
          ? 'Document approved!'
          : 'Changes requested on document'
      );
      setSelectedDocForReview(null);
      setReviewNotes('');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDocument = async (doc) => {
    if (doc.status === 'APPROVED') {
      toast.error('Approved documents cannot be deleted');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return;
    }

    try {
      await documentApi.deleteDocument(projectId, doc._id);
      toast.success('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Project Documents & Deliverables
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload project specifications, track revisions, and submit deliverables for faculty approval.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Category Pills & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const count =
              cat.id === 'ALL'
                ? documents.length
                : documents.filter((d) => d.category === cat.id).length;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat.label}
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-indigo-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="CHANGES_REQUESTED">Changes Requested</option>
          </select>
        </div>
      </div>

      {/* Documents Grid / Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Documents Uploaded
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {activeCategory === 'ALL'
              ? 'Upload project documentation such as proposals, SRS, architecture designs, or presentation decks.'
              : `No documents uploaded under ${activeCategory.toLowerCase().replace('_', ' ')} yet.`}
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 mt-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => {
            const statusConfig = STATUS_BADGES[doc.status] || STATUS_BADGES.DRAFT;
            const StatusIcon = statusConfig.icon;
            const isUploader = doc.uploadedBy?._id === user?._id;

            return (
              <div
                key={doc._id}
                className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
              >
                <div className="space-y-3">
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {doc.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        v{doc.version}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Title & File info */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                      {doc.fileName}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Size: {formatFileSize(doc.size)}</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
                        {doc.uploadedBy?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="truncate">By {doc.uploadedBy?.name || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Faculty Review Feedback Note */}
                  {doc.reviewNotes && (
                    <div
                      className={`p-2.5 rounded-xl text-xs space-y-1 border ${
                        doc.status === 'APPROVED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-semibold text-[11px]">
                        <MessageSquare className="w-3 h-3" />
                        Guide Review ({doc.reviewedBy?.name || 'Faculty'}):
                      </div>
                      <p className="italic text-[11px]">{doc.reviewNotes}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      title="Download / View file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View
                    </a>

                    <button
                      onClick={() => setSelectedDocForHistory(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                      title="View all revisions"
                    >
                      <History className="w-3.5 h-3.5" />
                      v{doc.version}
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Faculty Review button */}
                    {canReview && (
                      <button
                        onClick={() => {
                          setSelectedDocForReview(doc);
                          setReviewDecision(doc.status === 'APPROVED' ? 'APPROVED' : 'APPROVED');
                          setReviewNotes(doc.reviewNotes || '');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Review
                      </button>
                    )}

                    {/* Submit for review button for student when DRAFT or CHANGES_REQUESTED */}
                    {['DRAFT', 'CHANGES_REQUESTED'].includes(doc.status) && (
                      <button
                        onClick={() => handleSubmitForReview(doc)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                      >
                        Submit
                      </button>
                    )}

                    {/* Upload new revision version button */}
                    <button
                      onClick={() => setSelectedDocForVersion(doc)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                      title="Upload new revision"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Revision
                    </button>

                    {/* Delete button (if not approved and user has rights) */}
                    {doc.status !== 'APPROVED' && (isLeader || isUploader) && (
                      <button
                        onClick={() => handleDeleteDocument(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-indigo-600" />
                Upload Project Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Proposal & Feasibility Report"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="PROPOSAL">Proposal</option>
                  <option value="REQUIREMENTS">Requirements (SRS)</option>
                  <option value="DESIGN">Design & Architecture</option>
                  <option value="REPORT">Report (Mid-term / Progress)</option>
                  <option value="PRESENTATION">Presentation Deck</option>
                  <option value="FINAL_SUBMISSION">Final Project Submission</option>
                  <option value="OTHER">Other Documentation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  File Attachment * (PDF, DOCX, PPTX, XLSX, TXT, ZIP up to 25MB)
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadFile(file);
                      if (!uploadTitle) {
                        setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Version Notes (Optional)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Initial draft covering problem statement and tech stack"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="submitImmediately"
                  checked={submitImmediately}
                  onChange={(e) => setSubmitImmediately(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="submitImmediately" className="text-xs text-slate-700 dark:text-slate-300">
                  Submit immediately for faculty review (otherwise save as Draft)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Uploading...' : 'Upload Document'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Revision Modal */}
      {selectedDocForVersion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  Upload Revision (v{selectedDocForVersion.version + 1})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Updating "{selectedDocForVersion.title}"
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForVersion(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Updated File Attachment *
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setVersionFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950 dark:file:text-indigo-300 hover:file:bg-indigo-100 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl p-2 bg-slate-50 dark:bg-slate-800/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Revision Notes (What changed in this version?) *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Addressed guide comments: clarified database schema and API routing"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="versionSubmitImmediately"
                  checked={versionSubmitImmediately}
                  onChange={(e) => setVersionSubmitImmediately(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="versionSubmitImmediately" className="text-xs text-slate-700 dark:text-slate-300">
                  Submit this new revision for faculty review
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDocForVersion(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Uploading...' : `Upload v${selectedDocForVersion.version + 1}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Drawer / Modal */}
      {selectedDocForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" />
                  Version History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Revisions for "{selectedDocForHistory.title}"
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForHistory(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {[...selectedDocForHistory.versions].reverse().map((v) => (
                <div
                  key={v.version}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        v{v.version}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {v.fileName}
                      </span>
                      {v.version === selectedDocForHistory.version && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          Current
                        </span>
                      )}
                    </div>
                    <a
                      href={v.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>

                  {v.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{v.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span>
                      Uploaded by {v.uploadedBy?.name || 'Team Member'} on{' '}
                      {new Date(v.uploadedAt).toLocaleString()}
                    </span>
                    <span>{formatFileSize(v.size)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedDocForHistory(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Review Modal */}
      {selectedDocForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-emerald-600" />
                  Review Document
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Evaluating "{selectedDocForReview.title}" (v{selectedDocForReview.version})
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForReview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Review Decision *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      reviewDecision === 'APPROVED'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-semibold ring-2 ring-emerald-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVED"
                      checked={reviewDecision === 'APPROVED'}
                      onChange={() => setReviewDecision('APPROVED')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs">Approve Document</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      reviewDecision === 'CHANGES_REQUESTED'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-semibold ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="decision"
                      value="CHANGES_REQUESTED"
                      checked={reviewDecision === 'CHANGES_REQUESTED'}
                      onChange={() => setReviewDecision('CHANGES_REQUESTED')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-xs">Request Changes</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Feedback Notes & Instructions
                </label>
                <textarea
                  rows="3"
                  placeholder={
                    reviewDecision === 'APPROVED'
                      ? 'e.g. Excellent work. Approved for next phase.'
                      : 'e.g. Please elaborate section 3 on data validation and resubmit.'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedDocForReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 text-xs font-semibold rounded-xl text-white disabled:opacity-50 transition-colors ${
                    reviewDecision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {submitting ? 'Submitting...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

