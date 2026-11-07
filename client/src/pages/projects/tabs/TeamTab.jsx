import React, { useState } from 'react';
import {
  Users,
  Copy,
  RefreshCw,
  Plus,
  Shield,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  UserCheck,
  Edit2
} from 'lucide-react';
import { projectApi } from '../../../services/projectApi.js';
import toast from 'react-hot-toast';

export const TeamTab = ({ data, onRefresh }) => {
  const { project, teamMembers, pendingInvitations, currentUserRole } = data;
  const isLeader = currentUserRole === 'LEADER';

  // Join Code Copy State
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Modals state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResponsibility, setInviteResponsibility] = useState('');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewLeaderId, setSelectedNewLeaderId] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [showEditRespModal, setShowEditRespModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editRespText, setEditRespText] = useState('');
  const [updatingResp, setUpdatingResp] = useState(false);

  // Copy join code
  const handleCopyCode = () => {
    if (project.teamId?.joinCode) {
      navigator.clipboard.writeText(project.teamId.joinCode);
      setCopied(true);
      toast.success('Join code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Regenerate join code
  const handleRegenerateCode = async () => {
    if (!confirm('Are you sure you want to regenerate the join code? The old code will expire immediately.')) {
      return;
    }
    try {
      setRegenerating(true);
      await projectApi.regenerateJoinCode(project._id);
      toast.success('Join code regenerated successfully!');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to regenerate code');
    } finally {
      setRegenerating(false);
    }
  };

  // Send email invite
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      setSubmittingInvite(true);
      await projectApi.inviteMember(project._id, {
        email: inviteEmail.trim().toLowerCase(),
        responsibility: inviteResponsibility.trim()
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteResponsibility('');
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSubmittingInvite(false);
    }
  };

  // Respond to join request
  const handleRespondRequest = async (requestId, decision) => {
    try {
      await projectApi.respondJoinRequest(project._id, requestId, decision);
      toast.success(`Request ${decision.toLowerCase()}ed successfully`);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${decision.toLowerCase()} request`);
    }
  };

  // Transfer Leadership
  const handleTransferLeadership = async () => {
    if (!selectedNewLeaderId) {
      toast.error('Please select a member to promote to Leader');
      return;
    }
    try {
      setTransferring(true);
      await projectApi.transferLeadership(project._id, selectedNewLeaderId);
      toast.success('Leadership transferred successfully!');
      setShowTransferModal(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer leadership');
    } finally {
      setTransferring(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this project team?`)) {
      return;
    }
    try {
      await projectApi.removeMember(project._id, memberId);
      toast.success(`${memberName} has been removed from the team`);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Update responsibility
  const handleUpdateResponsibility = async (e) => {
    e.preventDefault();
    try {
      setUpdatingResp(true);
      await projectApi.updateMember(project._id, editingMember._id, {
        responsibility: editRespText
      });
      toast.success('Responsibility updated');
      setShowEditRespModal(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setUpdatingResp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Join Code & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Join Code Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <span>Team Join Code</span>
              <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded font-normal">Active</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Share with classmates to let them request to join this project team.
            </p>
            <div className="mt-3 font-mono text-2xl font-black tracking-widest text-slate-900 dark:text-white bg-white dark:bg-slate-900/80 px-4 py-2 rounded-xl border border-indigo-500/30 text-center">
              {project.teamId?.joinCode || '------'}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCopyCode}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
            {isLeader && (
              <button
                onClick={handleRegenerateCode}
                disabled={regenerating}
                title="Regenerate Join Code"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Team Summary & Actions */}
        <div className="md:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Team Composition
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-500">
                {teamMembers?.length || 0} Active Members
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Every project has a single designated Leader who assigns tasks, updates milestones, and manages approvals. Leaders can also invite peers or transfer the project leadership at any time.
            </p>
          </div>

          {isLeader && (
            <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Invite Member by Email
              </button>
              <button
                onClick={() => setShowTransferModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Transfer Leadership
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pending Join Requests (Leader View Only) */}
      {isLeader && pendingInvitations && pendingInvitations.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Pending Join Requests ({pendingInvitations.length})
            </h3>
            <span className="text-xs text-slate-400">Action Required</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv._id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {inv.userId?.name || inv.email}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {inv.userId?.rollNumber ? `Roll: ${inv.userId.rollNumber} • ` : ''}
                    {inv.type === 'JOIN_CODE_REQUEST' ? 'Via Join Code' : 'Email Invitation'}
                  </p>
                </div>

                {inv.type === 'JOIN_CODE_REQUEST' ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRespondRequest(inv._id, 'ACCEPTED')}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                      title="Accept"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRespondRequest(inv._id, 'REJECTED')}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition-colors"
                      title="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                    Invited
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Team Members Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Active Team Members
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamMembers?.map((m) => {
            const isSelf = m.userId?._id === data.project.createdBy?._id;
            const isMemberLeader = m.projectRole === 'LEADER';

            return (
              <div
                key={m._id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/20">
                      {m.userId?.name ? m.userId.name[0] : 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {m.userId?.name}
                        {isMemberLeader && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            LEADER
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {m.userId?.email}
                      </p>
                    </div>
                  </div>

                  {isLeader && !isMemberLeader && (
                    <button
                      onClick={() => handleRemoveMember(m._id, m.userId?.name)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Academic & Responsibility Info */}
                <div className="text-xs space-y-1.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>Responsibility:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {m.responsibility || (isMemberLeader ? 'Project Leader' : 'Team Member')}
                      </span>
                      {isLeader && (
                        <button
                          onClick={() => {
                            setEditingMember(m);
                            setEditRespText(m.responsibility || '');
                            setShowEditRespModal(true);
                          }}
                          className="text-indigo-500 hover:text-indigo-400 ml-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {m.userId?.rollNumber && (
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Roll Number:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {m.userId.rollNumber}
                      </span>
                    </div>
                  )}

                  {/* Skills tags */}
                  {m.userId?.skills && m.userId.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {m.userId.skills.slice(0, 3).map((sk) => (
                        <span
                          key={sk}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        >
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal 1: Invite Member by Email */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              Invite Team Member
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              An invitation with a 7-day acceptance link will be sent to the student's college email.
            </p>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Student College Email
                </label>
                <input
                  type="email"
                  placeholder="student@college.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Expected Responsibility / Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Backend API Lead, Hardware Tester"
                  value={inviteResponsibility}
                  onChange={(e) => setInviteResponsibility(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingInvite}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {submittingInvite ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Transfer Leadership */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              Transfer Project Leadership
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select an active member to promote to Project Leader. You will step down to regular Member status.
            </p>

            <div className="space-y-2">
              {teamMembers
                ?.filter((m) => m.projectRole !== 'LEADER')
                .map((m) => (
                  <label
                    key={m.userId?._id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs ${
                      selectedNewLeaderId === m.userId?._id
                        ? 'border-indigo-600 bg-indigo-500/10 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <p className="text-slate-900 dark:text-white">{m.userId?.name}</p>
                      <p className="text-[11px] text-slate-400">{m.userId?.email}</p>
                    </div>
                    <input
                      type="radio"
                      name="newLeader"
                      value={m.userId?._id}
                      checked={selectedNewLeaderId === m.userId?._id}
                      onChange={(e) => setSelectedNewLeaderId(e.target.value)}
                      className="text-indigo-600"
                    />
                  </label>
                ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferLeadership}
                disabled={transferring || !selectedNewLeaderId}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50"
              >
                {transferring ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Responsibility */}
      {showEditRespModal && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Edit Responsibility for {editingMember.userId?.name}
            </h3>

            <form onSubmit={handleUpdateResponsibility} className="space-y-4">
              <input
                type="text"
                value={editRespText}
                onChange={(e) => setEditRespText(e.target.value)}
                placeholder="e.g. Lead Frontend Architect"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditRespModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingResp}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

