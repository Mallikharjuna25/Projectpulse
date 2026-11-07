import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Building,
  Layers,
  Hash,
  Calendar,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { collegeApi } from '../../services/collegeApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  // College & Department dropdown states
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    collegeId: '',
    departmentId: '',
    email: '',
    rollNumber: '',
    academicYear: '4th',
    section: 'A',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [selectedCollege, setSelectedCollege] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Fetch public active colleges on mount
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await collegeApi.getPublicColleges();
        setColleges(res.data?.colleges || []);
      } catch (err) {
        toast.error('Failed to load colleges list');
      } finally {
        setCollegesLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // When college changes, fetch its departments & track selected college domain
  const handleCollegeChange = async (e) => {
    const colId = e.target.value;
    const found = colleges.find((c) => c._id === colId);
    setSelectedCollege(found || null);

    setFormData((prev) => ({
      ...prev,
      collegeId: colId,
      departmentId: ''
    }));

    if (!colId) {
      setDepartments([]);
      return;
    }

    setDepartmentsLoading(true);
    try {
      const res = await collegeApi.getPublicDepartments(colId);
      setDepartments(res.data?.departments || []);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (strength < 3) {
      setErrorMessage('Password must be at least 8 characters and contain uppercase, lowercase, and numeric characters.');
      return;
    }

    if (!formData.acceptTerms) {
      setErrorMessage('Please accept the college code of conduct and terms.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        collegeId: formData.collegeId,
        departmentId: formData.departmentId || null,
        rollNumber: formData.rollNumber,
        academicYear: formData.academicYear,
        section: formData.section
      });

      setSuccessInfo(res);
      toast.success('Registration successful! Email verification link generated.');
    } catch (err) {
      const msg = err.message || 'Registration failed. Please review your details.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (successInfo) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
          <Card className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account Created!</h2>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Your account has been registered for{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{formData.email}</span>.
            </p>

            {successInfo.verificationToken && (
              <div className="mt-4 p-3 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-left">
                <span className="text-[11px] font-semibold text-brand-800 dark:text-brand-300 block mb-1">
                  Email Verification:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Please verify your email address to complete registration.
                </p>
                <div className="mt-2.5">
                  <Link
                    to={`/verify-email?token=${successInfo.verificationToken}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs"
                  >
                    Activate & Verify Account <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link to="/login">
                <Button size="md" className="w-full">
                  Proceed to Login
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white flex items-center justify-center font-black text-xl shadow-md">
            P
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            Project<span className="text-brand-600 dark:text-brand-400">Pulse</span>
          </span>
        </Link>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create Student Account
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Sign In here
          </Link>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <Card className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Johnathan Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* College Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Your College *
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={formData.collegeId}
                  onChange={handleCollegeChange}
                  disabled={collegesLoading}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Choose an active college --</option>
                  {colleges.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.collegeName} ({c.collegeCode})
                    </option>
                  ))}
                </select>
              </div>
              {!collegesLoading && colleges.length === 0 && (
                <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-semibold">No colleges registered yet</p>
                  <p className="mt-0.5 text-[11px]">
                    If you are an institutional administrator, please log in as Super Admin to onboard your college.
                  </p>
                </div>
              )}
              {selectedCollege?.emailDomain && (
                <p className="mt-1 text-[11px] text-brand-600 dark:text-brand-400">
                  Notice: This college requires your @{selectedCollege.emailDomain} institutional email.
                </p>
              )}
            </div>

            {/* Department Selector */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  disabled={!formData.collegeId || departmentsLoading}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                >
                  <option value="">-- Select department --</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* College Email */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder={
                    selectedCollege?.emailDomain
                      ? `your.name@${selectedCollege.emailDomain}`
                      : 'student@college.edu'
                  }
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Roll Number, Academic Year, Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Roll / Reg No. *
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="CSE-2026-042"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Academic Year
                </label>
                <select
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
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
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 8 chars, 1 Upper, 1 Num"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-9 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Password Strength Meter */}
            {formData.password && (
              <div className="space-y-1">
                <div className="flex gap-1 h-1.5 w-full">
                  <div
                    className={`h-full rounded-full flex-1 ${
                      strength >= 1 ? 'bg-rose-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                  <div
                    className={`h-full rounded-full flex-1 ${
                      strength >= 2 ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                  <div
                    className={`h-full rounded-full flex-1 ${
                      strength >= 3 ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                  <div
                    className={`h-full rounded-full flex-1 ${
                      strength >= 4 ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                </div>
                <span className="text-[10px] text-slate-400">
                  Strength:{' '}
                  {strength < 2 ? 'Weak' : strength < 3 ? 'Fair' : strength < 4 ? 'Good' : 'Strong'}
                </span>
              </div>
            )}

            {/* Accept Terms */}
            <div className="pt-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.acceptTerms}
                  onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="text-slate-600 dark:text-slate-400 text-[11px] leading-tight">
                  I agree to my institution's academic honor code, anti-plagiarism guidelines, and ProjectPulse terms of service.
                </span>
              </label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="md"
              loading={loading}
              className="w-full mt-4"
              icon={ArrowRight}
            >
              Create Student Account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

