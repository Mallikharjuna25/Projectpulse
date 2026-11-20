import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Lock,
  Mail,
  Building,
  Layers,
  Hash,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  XCircle,
  LogOut,
  Sparkles,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import { authApi } from '../../services/authApi.js';
import { userManagementApi } from '../../services/userManagementApi.js';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';

export const ProfilePage = () => {
  const { user, refreshUser, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Determine initial tab from route (/settings -> security, or ?tab=security)
  const isSettingsRoute = location.pathname === '/settings' || searchParams.get('tab') === 'security';
  const [activeTab, setActiveTab] = useState(isSettingsRoute ? 'security' : 'profile');

  // React to path changes
  useEffect(() => {
    if (location.pathname === '/settings' || searchParams.get('tab') === 'security') {
      setActiveTab('security');
    }
  }, [location.pathname, searchParams]);

  // Profile Edit State
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(user?.skills || []);
  const [savingProfile, setSavingProfile] = useState(false);

  // Sync state if user updates
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || '');
      setSkills(user.skills || []);
    }
  }, [user]);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccessBanner, setPasswordSuccessBanner] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Password validation criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordFormValid =
    currentPassword.trim().length > 0 &&
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    passwordsMatch;

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await authApi.updateMe({
        name,
        bio,
        avatar,
        skills
      });
      await refreshUser();
      toast.success('Profile details updated successfully');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccessBanner(false);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      toast.error('Current password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      toast.error('New passwords do not match');
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber) {
      setPasswordError('New password does not meet the complexity requirements.');
      toast.error('Please meet all password complexity requirements');
      return;
    }

    setSavingPassword(true);
    try {
      await userManagementApi.changePassword({
        currentPassword,
        newPassword
      });

      toast.success('Password updated successfully! Old password is now deactivated.');
      setPasswordSuccessBanner(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to change password';
      setPasswordError(msg);
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoutAndTest = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'purple';
      case 'COLLEGE_ADMIN':
        return 'blue';
      case 'FACULTY':
        return 'amber';
      default:
        return 'indigo';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Summary */}
      <div className="p-6 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-lg">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="relative w-20 h-20 rounded-full bg-surface-elevation-2 border-2 border-primary-container text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0 overflow-hidden">
            {avatar ? (
              <img src={avatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-container font-headline-sm">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-status-success ring-2 ring-surface-elevation-1" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1">
              <h1 className="text-xl font-bold text-text-primary tracking-tight truncate">
                {user?.name}
              </h1>
              <Badge variant={getRoleBadgeVariant(user?.globalRole)} size="sm">
                {user?.globalRole}
              </Badge>
            </div>

            <p className="text-xs text-text-secondary truncate flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-text-tertiary" />
              {user?.email}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-text-secondary">
              {user?.collegeId && (
                <span className="flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-md bg-surface-elevation-2 border border-border-glass">
                  <Building className="w-3.5 h-3.5 text-amber-bright" />
                  {user.collegeId.collegeName || user.collegeId.collegeCode}
                </span>
              )}
              {user?.departmentId && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-elevation-2 border border-border-glass">
                  <Layers className="w-3.5 h-3.5 text-text-tertiary" />
                  {user.departmentId.name}
                </span>
              )}
              {user?.rollNumber && (
                <span className="flex items-center gap-1.5 font-code-token text-amber-light px-2.5 py-1 rounded-md bg-surface-elevation-2 border border-border-glass">
                  <Hash className="w-3.5 h-3.5 text-text-tertiary" />
                  {user.rollNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 border-t border-border-glass pt-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'profile'
                ? 'bg-primary-container/15 text-primary-container border border-primary-container/30 font-bold'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevation-2'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeTab === 'security'
                ? 'bg-primary-container/15 text-primary-container border border-primary-container/30 font-bold shadow-[0_0_12px_rgba(255,107,0,0.2)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevation-2'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-bright" />
            <span>Update Password & Security</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Profile Information */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Edit Profile Information
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Update your public profile display name, avatar, bio, and technical skills.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-glass bg-surface-elevation-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Avatar Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-glass bg-surface-elevation-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Bio / Academic & Technical Focus
              </label>
              <textarea
                rows={3}
                placeholder="Write a brief overview of your technical focus or research interests..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-glass bg-surface-elevation-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
              />
            </div>

            {/* Skills Tag Input */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Skills & Tech Stack Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="e.g. React, Node.js, ROS2, PyTorch"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(e);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-lg border border-border-glass bg-surface-elevation-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
                />
                <Button type="button" size="sm" onClick={handleAddSkill}>
                  Add Skill
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2.5 rounded-lg border border-border-glass bg-surface-elevation-2">
                {skills.length === 0 ? (
                  <span className="text-[11px] text-text-tertiary py-0.5">No skills added yet</span>
                ) : (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-container/10 border border-primary-container/20 text-amber-bright text-xs font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-status-error ml-1 text-text-tertiary transition-colors"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <Button type="submit" size="sm" loading={savingProfile}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Password & Security */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-2xl bg-surface-elevation-1 border border-border-glass shadow-lg space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-5 h-5 text-amber-bright" />
              <h2 className="text-base font-bold text-text-primary">
                Update Account Password
              </h2>
            </div>
            <p className="text-xs text-text-secondary">
              Change your institutional login password. Updating your password will immediately invalidate your old password and revoke other active sessions.
            </p>
          </div>

          {/* Success Banner */}
          {passwordSuccessBanner && (
            <div className="p-4 rounded-xl bg-status-success/10 border border-status-success/30 text-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-status-success shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-status-success">
                    Password Successfully Updated!
                  </p>
                  <p className="text-text-secondary mt-1">
                    Your password has been changed. <strong className="text-text-primary">Your old password has been permanently deactivated</strong> and cannot be used to sign in anymore.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleLogoutAndTest}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevation-2 hover:bg-surface-elevation-3 text-text-primary border border-border-glass font-medium text-xs transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-amber-bright" />
                      Sign Out & Test New Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setPasswordSuccessBanner(false)}
                      className="text-text-tertiary hover:text-text-primary underline text-xs"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {passwordError && (
            <div className="p-4 rounded-xl bg-status-error/10 border border-status-error/30 text-xs animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-status-error shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-status-error">
                    Update Password Failed
                  </p>
                  <p className="text-text-secondary mt-0.5">
                    {passwordError}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg text-xs">
            {/* Current Password */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border-glass bg-surface-elevation-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-3 text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Toggle current password visibility"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter new strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border-glass bg-surface-elevation-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Toggle new password visibility"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block font-semibold text-text-secondary mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-border-glass bg-surface-elevation-2 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-container transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-text-tertiary hover:text-text-primary transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Complexity Checklist */}
            <div className="p-3.5 rounded-xl bg-surface-elevation-2 border border-border-glass space-y-2 text-[11px]">
              <p className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">
                Password Requirements
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-status-success' : 'text-text-tertiary'}`}>
                  {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-text-tertiary inline-block" />}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-status-success' : 'text-text-tertiary'}`}>
                  {hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-text-tertiary inline-block" />}
                  <span>One uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-status-success' : 'text-text-tertiary'}`}>
                  {hasLowercase ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-text-tertiary inline-block" />}
                  <span>One lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-status-success' : 'text-text-tertiary'}`}>
                  {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-text-tertiary inline-block" />}
                  <span>One number (0-9)</span>
                </div>
                <div className={`sm:col-span-2 flex items-center gap-1.5 ${passwordsMatch ? 'text-status-success' : 'text-text-tertiary'}`}>
                  {passwordsMatch ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-text-tertiary inline-block" />}
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="submit"
                size="sm"
                loading={savingPassword}
                disabled={!isPasswordFormValid || savingPassword}
              >
                Update Password
              </Button>
              {(currentPassword || newPassword || confirmPassword) && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="text-text-tertiary hover:text-text-primary transition-colors text-xs"
                >
                  Clear Fields
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
