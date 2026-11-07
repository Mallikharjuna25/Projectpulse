import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  FolderGit2,
  CheckCircle,
  Kanban,
  Calendar,
  Users2,
  FileCheck,
  BarChart,
  GitBranch,
  ShieldAlert,
  Clock,
  ArrowRight,
  ChevronDown,
  Sparkles,
  School,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);

  // If already logged in, redirect to appropriate role dashboard
  if (isAuthenticated && user) {
    const roleRoutes = {
      SUPER_ADMIN: '/super-admin',
      COLLEGE_ADMIN: '/admin',
      FACULTY: '/faculty',
      STUDENT: '/dashboard',
      REVIEWER: '/reviewer'
    };
    return <Navigate to={roleRoutes[user.globalRole] || '/dashboard'} replace />;
  }

  const faqs = [
    {
      q: 'Can our college use ProjectPulse without GitHub?',
      a: 'Absolutely! ProjectPulse is designed first and foremost as a comprehensive standalone project management system. GitHub integration is an optional add-on that can be enabled per project.',
    },
    {
      q: 'How does multi-tenant isolation protect our college data?',
      a: 'Every student, faculty member, department, and project belongs to an isolated college tenant. Cross-college access is strictly barred at the database query level with zero leakage.',
    },
    {
      q: 'How are faculty guides assigned to student projects?',
      a: 'ProjectPulse supports two flexible workflows: students can browse their college faculty and submit a supervision request, or the College Admin can directly allocate guides from the administrative dashboard.',
    },
    {
      q: 'How does progress calculation and health tracking work?',
      a: 'Progress is calculated as a weighted formula: 70% from priority-weighted task completion and 30% from milestone deliverables. Automated background engines monitor upcoming deadlines and activity to label health as On Track, At Risk, or Delayed.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Sticky Header Navbar */}
      <nav className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-sm">
              P
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Project<span className="text-brand-600 dark:text-brand-400">Pulse</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#problem" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Problem</a>
            <a href="#features" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Features</a>
            <a href="#roles" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Roles</a>
            <a href="#faq" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button variant="primary" size="sm" icon={ArrowRight}>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Multi-Tenant Academic Project Management & Collaboration</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Transform College Projects from <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-violet-600 dark:from-brand-400 dark:to-violet-400">Chaos</span> to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">Completion</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Centralize teams, Kanban tasks, milestone deadlines, faculty supervision, and document submissions in one secure multi-tenant platform.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full text-base px-8 py-3.5" icon={ArrowRight}>
                Join Your College
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full text-base px-8 py-3.5">
                Sign In to Workspace
              </Button>
            </Link>
          </div>

          {/* Platform Preview Banner */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-3 sm:p-4 shadow-xl backdrop-blur-md">
            <div className="rounded-xl overflow-hidden bg-slate-900 p-6 sm:p-8 text-left border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-lg">AI-Powered Disaster Relief Rover</span>
                    <Badge variant="blue">ACTIVE</Badge>
                    <Badge variant="green">ON TRACK</Badge>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">AIT-2026-004 · Apex Institute of Technology</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Overall Progress</div>
                    <div className="text-base font-bold text-emerald-400">74%</div>
                  </div>
                </div>
              </div>

              {/* Kanban Mockup Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                  <span className="font-semibold text-slate-300 block mb-2">TO DO (3)</span>
                  <div className="bg-slate-900 p-2.5 rounded border border-slate-700 text-slate-200">
                    <div className="text-[10px] text-amber-400 font-mono">TASK-022</div>
                    <div>Write Final Chapter 4 Report</div>
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                  <span className="font-semibold text-blue-300 block mb-2">IN PROGRESS (2)</span>
                  <div className="bg-slate-900 p-2.5 rounded border border-blue-500/40 text-slate-200">
                    <div className="text-[10px] text-blue-400 font-mono">TASK-018</div>
                    <div>Integrate Motor Driver PCB</div>
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                  <span className="font-semibold text-purple-300 block mb-2">IN REVIEW (1)</span>
                  <div className="bg-slate-900 p-2.5 rounded border border-purple-500/40 text-slate-200">
                    <div className="text-[10px] text-purple-400 font-mono">TASK-015</div>
                    <div>Telemetry API Endpoints</div>
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
                  <span className="font-semibold text-emerald-300 block mb-2">COMPLETED (8)</span>
                  <div className="bg-slate-900 p-2.5 rounded border border-emerald-500/40 text-slate-200 line-through opacity-75">
                    <div className="text-[10px] text-emerald-400 font-mono">TASK-009</div>
                    <div>Sensor Hardware Calibration</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Strip Section */}
      <section id="problem" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Why Traditional College Projects Fail
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
              Without a dedicated platform, final-year and semester projects collapse under poor coordination.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Scattered Communication</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Updates, code snippets, and design revisions get lost inside chaotic WhatsApp chats, email attachments, and unorganized Google Drives.
              </p>
            </Card>

            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Blind Spot Deadlines</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Team leaders and faculty guide professors discover delays only on the eve of final evaluations when it is too late to course correct.
              </p>
            </Card>

            <Card className="p-6 border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Users2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Unequal Workload & Free Riders</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Faculty cannot verify individual member contributions, leaving hardworking students frustrated and leaders overburdened.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Complete End-to-End Project Lifecycle
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-base">
              Everything required from team formation and proposal approval to viva submission.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6" hover>
              <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center mb-4">
                <Kanban className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Real-Time Kanban Board</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Drag-and-drop tasks with priority weighting, checklists, file attachments, and instant Socket.IO synchronization across all teammates.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Milestones & Timeline</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Track deliverables, enforce deadline audit histories, and visualize task deadlines on full interactive month/week calendars.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Faculty Supervision Workflow</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Supervision request queues, guide workload management, feedback comments, and document approval cycles built specifically for professors.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Document Versioning & Submissions</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Upload reports, presentations, and code ZIPs with full version history, revision requests, and final project sign-off controls.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center mb-4">
                <BarChart className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Contribution & Health Analytics</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automated health status engine (On Track / At Risk / Delayed), burn-up charts, and equitable member contribution reports.
              </p>
            </Card>

            <Card className="p-6" hover>
              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-4">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Optional GitHub Integration</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Link repositories, commits, and pull requests directly to task codes with real-time webhooks. Fully decoupled and optional.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Role Cards Section */}
      <section id="roles" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Tailored Dashboards for Every Stakeholder
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-base">
              Distinct permissions and workspaces designed for campus collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-5 flex flex-col justify-between">
              <div>
                <Badge variant="indigo" size="sm" className="mb-3">STUDENT</Badge>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Student Member</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Focus on assigned tasks, upload daily progress notes, join teams with invite codes, and submit deliverables.
                </p>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> My Tasks view</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Deadline reminders</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Contribution tracking</li>
              </ul>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <Badge variant="blue" size="sm" className="mb-3">LEADER</Badge>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Team Leader</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Create projects, delegate tasks, build milestone timelines, request faculty supervision, and oversee submissions.
                </p>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Team member management</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Milestone setting</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Final submission approval</li>
              </ul>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <Badge variant="amber" size="sm" className="mb-3">FACULTY</Badge>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Faculty Guide</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Monitor multiple assigned teams from a single pane, review reports, leave feedback, and track weekly progress.
                </p>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> At-risk project alerts</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Review queue approval</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Weekly update monitoring</li>
              </ul>
            </Card>

            <Card className="p-5 flex flex-col justify-between">
              <div>
                <Badge variant="purple" size="sm" className="mb-3">ADMIN</Badge>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">College Admin</h3>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Manage departments, import student rosters in bulk, balance faculty workload, and view institutional analytics.
                </p>
              </div>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Department management</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Guide allocation queue</li>
                <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> College-wide exports</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-tr from-brand-900 to-indigo-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Supercharge Your Academic Projects?
          </h2>
          <p className="mt-4 text-brand-200 text-sm sm:text-base max-w-xl mx-auto">
            Join ProjectPulse today to bring clarity, discipline, and success to your college project teams.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-white text-brand-950 hover:bg-brand-50 shadow-lg">
                Create Free Student Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">ProjectPulse</span>
            <span>&copy; {new Date().getFullYear()} · Multi-College Project Management Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:underline">Sign In</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

