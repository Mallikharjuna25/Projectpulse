import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FolderGit2,
  Calendar,
  Users,
  Shield,
  Layers,
  Sparkles,
  X,
  Plus
} from 'lucide-react';
import { projectApi } from '../../services/projectApi.js';
import toast from 'react-hot-toast';

export const CreateProjectWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    description: '',
    domain: 'Artificial Intelligence',
    techStack: ['React', 'Node.js'],
    objectives: ['Implement core features', 'Complete user testing'],
    priority: 'MEDIUM',
    startDate: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    visibility: 'COLLEGE',
    invitedEmails: []
  });

  // Local helper inputs
  const [tagInput, setTagInput] = useState('');
  const [objectiveInput, setObjectiveInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  // Tech stack tag management
  const addTechTag = () => {
    if (tagInput.trim() && !formData.techStack.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        techStack: [...formData.techStack, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTechTag = (tagToRemove) => {
    setFormData({
      ...formData,
      techStack: formData.techStack.filter((t) => t !== tagToRemove)
    });
  };

  // Objectives management
  const addObjective = () => {
    if (objectiveInput.trim()) {
      setFormData({
        ...formData,
        objectives: [...formData.objectives, objectiveInput.trim()]
      });
      setObjectiveInput('');
    }
  };

  const removeObjective = (indexToRemove) => {
    setFormData({
      ...formData,
      objectives: formData.objectives.filter((_, idx) => idx !== indexToRemove)
    });
  };

  // Invited emails management
  const addEmail = () => {
    const clean = emailInput.trim().toLowerCase();
    if (clean && clean.includes('@') && !formData.invitedEmails.includes(clean)) {
      setFormData({
        ...formData,
        invitedEmails: [...formData.invitedEmails, clean]
      });
      setEmailInput('');
    } else if (clean && !clean.includes('@')) {
      toast.error('Please enter a valid email address');
    }
  };

  const removeEmail = (emailToRemove) => {
    setFormData({
      ...formData,
      invitedEmails: formData.invitedEmails.filter((e) => e !== emailToRemove)
    });
  };

  // Step validation
  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.title || formData.title.trim().length < 5) {
        toast.error('Title must be at least 5 characters');
        return false;
      }
      if (!formData.domain) {
        toast.error('Please specify a project domain');
        return false;
      }
    }
    if (step === 2) {
      if (!formData.deadline) {
        toast.error('Project deadline is required');
        return false;
      }
      if (new Date(formData.deadline) <= new Date(formData.startDate)) {
        toast.error('Deadline must be after start date');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (loading) return;
    try {
      setLoading(true);
      const res = await projectApi.createProject(formData);
      toast.success('Project created successfully!');
      const newProjectId =
        res?.data?.project?._id ||
        res?.project?._id ||
        res?.data?._id ||
        res?._id;
      if (newProjectId) {
        navigate(`/projects/${newProjectId}`);
      } else {
        navigate('/projects');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basics', icon: FolderGit2 },
    { number: 2, title: 'Timeline & Scope', icon: Calendar },
    { number: 3, title: 'Team Invites', icon: Users },
    { number: 4, title: 'Review & Submit', icon: Check }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/projects"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create New Project
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set up your project workspace, define objectives, and assemble your team
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-4 gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.number;
          const isDone = currentStep > s.number;

          return (
            <div
              key={s.number}
              className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                isActive
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : isDone
                  ? 'text-emerald-500 font-medium'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : s.number}
              </div>
              <span className="hidden sm:inline text-xs">{s.title}</span>
            </div>
          );
        })}
      </div>

      {/* Wizard Form Body */}
      <div className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Step 1: Basics */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Autonomous Drone Navigation System"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">5 to 120 characters</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Domain / Category <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Artificial Intelligence, Cloud, IoT"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Tech Stack Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. React, Docker, Python"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechTag();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={addTechTag}
                    className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Tag Pills */}
            {formData.techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.techStack.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTechTag(tag)}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Abstract / Summary
              </label>
              <textarea
                rows={3}
                placeholder="Brief summary of the problem, motivation, and solution architecture..."
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Key Objectives
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. Conduct sensor calibration tests"
                  value={objectiveInput}
                  onChange={(e) => setObjectiveInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addObjective();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={addObjective}
                  className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-xs font-semibold"
                >
                  Add
                </button>
              </div>

              {formData.objectives.length > 0 && (
                <ul className="space-y-1.5">
                  {formData.objectives.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        {obj}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeObjective(i)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Timeline & Scope */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Target Deadline <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Priority Level
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  College Visibility
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
                >
                  <option value="COLLEGE">Visible to College (Discovery Enabled)</option>
                  <option value="PRIVATE">Private (Team Members Only)</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Project Code & Unique Join Code
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A unique institutional project code (e.g. <code>AIT-2026-001</code>) and team join code will be automatically allocated upon submission.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Team Invites */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Invite Team Members
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add email addresses of peers in your college to send instant project invitations.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="peer@ait.edu"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addEmail();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={addEmail}
                className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                Add Peer
              </button>
            </div>

            {formData.invitedEmails.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                No email invitations added yet. You can also share your team's join code later.
              </div>
            ) : (
              <ul className="space-y-2">
                {formData.invitedEmails.map((email) => (
                  <li
                    key={email}
                    className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{email}</span>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Review Project Specifications
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs space-y-3">
              <div className="pt-2">
                <span className="text-slate-400 block font-medium">Title:</span>
                <span className="text-slate-900 dark:text-white font-semibold text-sm">
                  {formData.title}
                </span>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-medium">Domain:</span>
                  <span className="text-slate-800 dark:text-slate-200">{formData.domain}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Priority:</span>
                  <span className="text-slate-800 dark:text-slate-200">{formData.priority}</span>
                </div>
              </div>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block font-medium">Timeline:</span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {formData.startDate} to {formData.deadline}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Visibility:</span>
                  <span className="text-slate-800 dark:text-slate-200">{formData.visibility}</span>
                </div>
              </div>

              {formData.techStack.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 block font-medium mb-1">Tech Stack:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {formData.invitedEmails.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-400 block font-medium mb-1">
                    Invited Peers ({formData.invitedEmails.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.invitedEmails.map((email) => (
                      <span
                        key={email}
                        className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-mono"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Project...' : 'Launch Project'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

