import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Briefcase, CheckCircle2, Lock, Mail, Phone, User, LogOut, Copy, Check,
  ExternalLink, Award, Zap, Menu, X, Loader2, BadgeCheck, Radio, Flame,
  TrendingUp, Wallet, Clock, Users, ChevronRight, GraduationCap, Building2, Sparkles, Send
} from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  TRACK_ROLES,
  fetchEarnMembership,
  saveEarnMembership,
  submitTaskVerification,
  requestSalaryDisbursement
} from './lib/earnSync';

/* ======================================================================
   MOTION TOKENS
   ====================================================================== */
const spring = { type: 'spring', stiffness: 360, damping: 26 };
const ease = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } }
};

/* ======================================================================
   BRAND LOGO
   ====================================================================== */
function Logo({ size = 36 }) {
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full animate-pulse"
        style={{ background: 'rgba(245, 197, 66, 0.15)', filter: 'blur(8px)' }} />
      <svg viewBox="0 0 60 60" style={{ width: size - 4, height: size - 4, position: 'relative', zIndex: 1 }}>
        {[...Array(8)].map((_, i) => (
          <path key={i} transform={`rotate(${i * 45}, 30, 30)`}
            d="M 30 5 Q 36 12 30 19 Q 24 12 30 5"
            fill="none" stroke="#F5C542" strokeWidth="1.4" opacity="0.85" />
        ))}
        <circle cx="30" cy="30" r="13" fill="#C59B27" opacity="0.25" />
        <text x="30" y="37" textAnchor="middle" fill="#F5C542" fontSize="15" fontWeight="bold" className="tamil">மீ</text>
      </svg>
    </div>
  );
}

/* ======================================================================
   STATUS PILL
   ====================================================================== */
function LivePill({ children }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-mono text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: 'rgba(245, 197, 66, 0.10)', border: '1px solid rgba(245, 197, 66, 0.22)', color: '#F5C542' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {children}
    </div>
  );
}

/* ======================================================================
   MAIN APP (UN.MEENAMMA / EARN)
   ====================================================================== */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'register'
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'tasks' | 'payout'

  // Auth form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('student');
  const [orgCollege, setOrgCollege] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Task Submission Modal
  const [activeTask, setActiveTask] = useState(null);
  const [proofText, setProofText] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

  // Salary Disbursement Modal
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaryUpi, setSalaryUpi] = useState('');
  const [disbursing, setDisbursing] = useState(false);
  const [disbursedSuccess, setDisbursedSuccess] = useState(false);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) hydrate(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) hydrate(session.user);
      else {
        setCurrentUser(null);
        setMembership(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const hydrate = async (user) => {
    const userObj = {
      id: user.id,
      name: user.user_metadata?.display_name || user.email.split('@')[0],
      email: user.email,
      phone: user.user_metadata?.phone || '',
    };
    setCurrentUser(userObj);
    const mem = await fetchEarnMembership(user.id);
    setMembership(mem);
  };

  const handleDemoLogin = async () => {
    const demoUser = {
      id: '338b3361-779c-474e-83d0-ff95a4b55901',
      name: 'Kavitha S. (Student Intern)',
      email: 'kavitha.intern@meenamma.org',
      phone: '+919840123456',
    };
    setCurrentUser(demoUser);
    const mem = await fetchEarnMembership(demoUser.id);
    setMembership(mem);
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    setView('landing');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) { setAuthError('Email and password required.'); return; }
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setAuthLoading(false);
    if (error) { setAuthError(error.message || 'Login failed.'); }
    else if (data?.user) {
      confetti({ particleCount: 60, spread: 70 });
      hydrate(data.user);
      setView('landing');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    if (!name || !email || !password || !phone) { setAuthError('All fields required.'); return; }
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: name.trim(),
          phone: phone.trim(),
          work_track: selectedTrack,
          organization: orgCollege.trim(),
        }
      }
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else if (data?.user) {
      await saveEarnMembership({
        userId: data.user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        trackId: selectedTrack,
        organization: orgCollege.trim(),
        upiId: 'member@upi'
      });
      confetti({ particleCount: 70, spread: 80 });
      hydrate(data.user);
      setView('landing');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setMembership(null);
  };

  const handleSubmitTaskProof = async () => {
    if (!proofText || !activeTask) return;
    setSubmittingProof(true);
    try {
      await submitTaskVerification({
        membershipId: membership.id,
        userId: currentUser.id,
        taskId: activeTask.id,
        proofText
      });
      // update local state
      const updatedTasks = membership.tasks.map(t =>
        t.id === activeTask.id ? { ...t, status: 'submitted' } : t
      );
      setMembership({ ...membership, tasks: updatedTasks });
      setActiveTask(null);
      setProofText('');
      confetti({ particleCount: 50, spread: 60 });
    } catch (_) {
      alert('Proof submission failed');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleClaimSalary = async () => {
    if (!salaryUpi) return;
    setDisbursing(true);
    try {
      await requestSalaryDisbursement({
        userId: currentUser.id,
        amountInr: membership.currentAccrued,
        upiId: salaryUpi.trim(),
        trackTitle: membership.trackTitle
      });
      setDisbursedSuccess(true);
      setTimeout(() => {
        setDisbursedSuccess(false);
        setShowSalaryModal(false);
      }, 2000);
    } catch (_) {
      alert('Disbursement request failed');
    } finally {
      setDisbursing(false);
    }
  };

  return (
    <div className="min-h-screen ambient-glow-earn text-[#F5F5F0] flex flex-col relative overflow-x-hidden">

      {/* ── LIVE STRIP ── */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 text-[11px] font-mono border-b"
        style={{ background: 'rgba(5,7,8,0.85)', borderColor: 'rgba(245,197,66,0.14)', color: '#A89E88' }}>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Meenamma Work & Earn Opportunity · Monthly Salary Model · Two-Way Cloud Sync</span>
        </div>
        <span>Open for: <strong className="text-amber-400">Students, Housewives & Community Leaders</strong></span>
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(5,7,8,0.95)', backdropFilter: 'blur(20px)', borderColor: 'rgba(245,197,66,0.12)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          <button className="flex items-center gap-3 cursor-pointer text-left" onClick={() => { if (!currentUser) setView('landing'); }}>
            <Logo />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl text-[#F5F5F0] leading-tight">Meenamma</span>
                <span className="badge badge-gold">Earn & Work</span>
              </div>
              <span className="hidden sm:block text-[10px] font-mono text-[#A89E88] uppercase tracking-widest">
                Structured Monthly Stipend & Employment
              </span>
            </div>
          </button>

          {/* Nav */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                <nav className="flex items-center gap-1 p-1 rounded-lg border"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(245,197,66,0.15)' }}>
                  {[
                    ['dashboard', 'My Work & Salary'],
                    ['tasks', 'Weekly Deliverables'],
                  ].map(([id, label]) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className="px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer"
                      style={{
                        background: activeTab === id ? '#F5C542' : 'transparent',
                        color: activeTab === id ? '#080806' : '#C7BFA8',
                      }}>
                      {label}
                    </button>
                  ))}
                </nav>
                <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: 'rgba(245,197,66,0.15)' }}>
                  <span className="text-xs font-mono text-amber-400 font-bold">{currentUser.name}</span>
                  <button onClick={handleSignOut} className="p-2 rounded-lg text-[#A89E88] hover:text-amber-400 transition-colors cursor-pointer" title="Sign Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('login')} className="px-3 py-2 text-xs font-mono text-[#C7BFA8] hover:text-white uppercase tracking-wider cursor-pointer">
                  Member Login
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                  onClick={() => setView('register')}
                  className="btn-gold px-4 py-2 text-xs uppercase tracking-wider">
                  Apply for Work Opportunity
                </motion.button>
              </div>
            )}
            <a href="https://meenamma.org" target="_blank" rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1 pl-3 border-l text-xs text-[#A89E88] hover:text-amber-400 transition-colors font-mono"
              style={{ borderColor: 'rgba(245,197,66,0.15)' }}>
              meenamma.org <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg border border-amber-500/20 text-white cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          LANDING PAGE: Structured Work & Fixed Salary
          ============================================================ */}
      {view === 'landing' && !currentUser && (
        <main className="flex-1">
          {/* HERO */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 section-gap">
            <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">
              <motion.div variants={fadeUp}>
                <LivePill>Fixed Monthly Salary · Not Sales Commission</LivePill>
              </motion.div>

              <motion.h1 variants={fadeUp}
                className="text-display mt-5 text-[clamp(2.5rem,5.5vw,4.2rem)] text-[#F5F5F0] leading-[1.08]">
                Work with Meenamma. Get a guaranteed monthly salary, not commissions.
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 text-base sm:text-lg text-[#C7BFA8] max-w-2xl leading-relaxed">
                Whether you are a college student looking for an internship or a housewife seeking independent income from home, Meenamma offers structured employment with fixed monthly stipends (₹4,500 – ₹7,000/mo).
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mt-8">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                  onClick={() => setView('register')}
                  className="btn-gold px-8 py-4 text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                  Apply for Role <ArrowRight className="w-4 h-4" />
                </motion.button>
                <button onClick={handleDemoLogin}
                  className="px-6 py-4 rounded-lg border text-sm font-mono text-amber-400 cursor-pointer hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-2"
                  style={{ borderColor: 'rgba(245,197,66,0.25)' }}>
                  <Zap className="w-4 h-4" /> 1-Click Intern Demo
                </button>
              </motion.div>
            </motion.div>
          </section>

          {/* THREE TRACKS */}
          <section className="border-y section-gap" style={{ borderColor: 'rgba(245,197,66,0.10)', background: 'rgba(12,12,10,0.65)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-display text-3xl sm:text-4xl text-[#F5F5F0]">Available Work Tracks</h2>
                <p className="text-sm text-[#C7BFA8] mt-2 max-w-md mx-auto">
                  Pick the track that matches your availability. Every track carries a defined monthly payout.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.values(TRACK_ROLES).map((track) => (
                  <div key={track.id} className="card-glass p-7 border border-amber-500/20 space-y-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
                      {track.badge}
                    </span>
                    <h3 className="font-display text-2xl text-[#F5F5F0]">{track.title}</h3>
                    <div className="pt-2 pb-4 border-b border-white/10">
                      <span className="text-xs font-mono text-[#A89E88] uppercase">{track.period}</span>
                      <div className="text-4xl font-bold font-mono text-amber-400 mt-1">₹{track.stipend.toLocaleString('en-IN')}</div>
                    </div>
                    <p className="text-xs text-[#C7BFA8] leading-relaxed">{track.tagline}</p>

                    <div className="space-y-1.5 pt-2">
                      <div className="text-[11px] font-mono text-[#A89E88] font-semibold">Weekly Deliverables:</div>
                      {track.defaultTasks.slice(0, 2).map((task, i) => (
                        <div key={i} className="text-xs text-[#C7BFA8] flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════
          AUTHENTICATED MEMBER DASHBOARD (SALARY & TASKS)
          ============================================================ */}
      {currentUser && membership && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Member Banner */}
          <div className="card-glass p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-mono text-[#A89E88] uppercase tracking-wider">{membership.trackTitle}</span>
              </div>
              <h1 className="text-display text-3xl text-[#F5F5F0]">{currentUser.name}</h1>
              <p className="text-xs text-[#A89E88] font-mono mt-1">
                Organization: <strong className="text-amber-400">{membership.organization}</strong> · Status: <strong className="text-emerald-400">{membership.status}</strong>
              </p>
            </div>

            <div className="bg-[#070908] p-4 rounded-xl border border-amber-500/20 text-right">
              <div className="text-[10px] font-mono text-[#A89E88] uppercase">Fixed Base Pay</div>
              <div className="text-3xl font-bold font-mono text-amber-400 mt-1">₹{membership.monthlySalary} / mo</div>
              <div className="text-[11px] font-mono text-emerald-400 mt-1">Direct Bank / UPI Transfer</div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <div className="text-[10px] font-mono text-[#A89E88] uppercase tracking-wider mb-1">Current Month Accrued</div>
              <div className="text-display text-3xl text-amber-400 font-mono">₹{membership.currentAccrued}</div>
              <div className="text-[11px] text-[#A89E88] mt-1">Based on verified deliverables</div>
              <button onClick={() => setShowSalaryModal(true)}
                className="mt-3 btn-gold w-full py-1.5 text-xs uppercase tracking-wider cursor-pointer">
                Disburse to UPI
              </button>
            </div>

            <div className="stat-card">
              <div className="text-[10px] font-mono text-[#A89E88] uppercase tracking-wider mb-1">Total Salary Disbursed</div>
              <div className="text-display text-3xl text-[#F5F5F0] font-mono">₹{membership.totalPaid}</div>
              <div className="text-[11px] text-[#A89E88] mt-1">Lifetime payments transferred</div>
            </div>

            <div className="stat-card">
              <div className="text-[10px] font-mono text-[#A89E88] uppercase tracking-wider mb-1">Milestones Completed</div>
              <div className="text-display text-3xl text-emerald-400 font-mono">
                {membership.tasks.filter(t => t.status === 'verified').length} / {membership.tasks.length}
              </div>
              <div className="text-[11px] text-[#A89E88] mt-1">Tasks verified by mentor</div>
            </div>
          </div>

          {/* Task & Deliverables Roster */}
          <div className="card-glass p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-display text-2xl text-[#F5F5F0]">Weekly Deliverables & Timesheet</h2>
                <p className="text-xs text-[#C7BFA8] mt-0.5">
                  Complete and submit weekly milestones to clear your monthly salary disbursement.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {membership.tasks.map((task) => (
                <div key={task.id} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/20">
                        {task.week}
                      </span>
                      <h4 className="font-semibold text-sm text-[#F5F5F0]">{task.title}</h4>
                    </div>
                    <div className="text-xs font-mono text-[#A89E88] mt-1">
                      Stipend credit: <strong className="text-amber-400">₹{task.stipendCredit}</strong> · Status: <span className="uppercase text-emerald-400">{task.status}</span>
                    </div>
                  </div>

                  <div className="sm:shrink-0">
                    {task.status === 'verified' ? (
                      <span className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : task.status === 'submitted' ? (
                      <span className="px-3 py-1.5 rounded bg-amber-500/10 text-amber-300 text-xs font-mono border border-amber-500/20 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Under Review
                      </span>
                    ) : (
                      <button onClick={() => setActiveTask(task)}
                        className="btn-gold px-4 py-1.5 text-xs uppercase tracking-wider cursor-pointer flex items-center gap-1">
                        <Send className="w-3 h-3" /> Submit Proof
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      )}

      {/* ── TASK PROOF SUBMIT MODAL ── */}
      <AnimatePresence>
        {activeTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card-glass w-full max-w-md p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-display text-xl text-[#F5F5F0]">Submit Milestone Deliverable</h3>
                <button onClick={() => setActiveTask(null)} className="text-[#A89E88] hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-xs font-mono text-amber-300">
                {activeTask.week}: {activeTask.title} (Credit: ₹{activeTask.stipendCredit})
              </div>

              <div>
                <label className="block text-xs font-mono text-[#C7BFA8] mb-1">Summary / Proof / Link</label>
                <textarea rows={4} required placeholder="Describe what you did or share a Google Drive / WhatsApp group link"
                  value={proofText} onChange={e => setProofText(e.target.value)} className="input-cyber w-full" />
              </div>

              <button onClick={handleSubmitTaskProof} disabled={submittingProof || !proofText}
                className="btn-gold w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                {submittingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit for Verification'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SALARY DISBURSEMENT MODAL ── */}
      <AnimatePresence>
        {showSalaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card-glass w-full max-w-md p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-display text-xl text-[#F5F5F0]">Withdraw Accrued Salary</h3>
                <button onClick={() => setShowSalaryModal(false)} className="text-[#A89E88] hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#070908] border border-amber-500/20">
                <div className="text-xs font-mono text-[#A89E88]">Available Accrued Amount</div>
                <div className="text-3xl font-bold font-mono text-amber-400 mt-1">₹{membership.currentAccrued}</div>
              </div>

              {disbursedSuccess ? (
                <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center">
                  Salary payout request initiated! Transferred to your UPI within 2 hours.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#C7BFA8] mb-1">UPI ID for Payment</label>
                    <input type="text" placeholder="e.g. mobile@okhdfcbank" value={salaryUpi} onChange={e => setSalaryUpi(e.target.value)} className="input-cyber" />
                  </div>
                  <button onClick={handleClaimSalary} disabled={disbursing || !salaryUpi}
                    className="btn-gold w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer">
                    {disbursing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Salary Payout'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── AUTH MODALS ── */}
      <AnimatePresence>
        {(view === 'login' || view === 'register') && !currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="card-glass w-full max-w-md p-8 sm:p-10 space-y-4">
              <button onClick={() => setView('landing')} className="text-xs font-mono text-[#A89E88] hover:text-amber-400 flex items-center gap-1.5 cursor-pointer">
                ← Back
              </button>

              <h2 className="text-display text-3xl text-[#F5F5F0]">
                {view === 'login' ? 'Member Login' : 'Work Application'}
              </h2>
              <p className="text-xs text-[#C7BFA8]">
                {view === 'login' ? 'Access your monthly timesheet and salary ledger.' : 'Apply for a student internship or community lead position.'}
              </p>

              {authError && <div className="p-3 rounded text-xs font-mono text-rose-300 bg-rose-950/30 border border-rose-500/20">{authError}</div>}
              {authSuccess && <div className="p-3 rounded text-xs font-mono text-emerald-300 bg-emerald-950/30 border border-emerald-500/20">{authSuccess}</div>}

              {view === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="input-cyber" />
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="input-cyber" />
                  <button type="submit" disabled={authLoading} className="btn-gold w-full py-3.5 text-xs uppercase tracking-wider cursor-pointer">
                    {authLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                  <button type="button" onClick={handleDemoLogin} className="w-full py-3 rounded-lg border text-xs font-mono text-amber-400 border-amber-500/20 hover:bg-amber-500/10 cursor-pointer">
                    ⚡ 1-Click Intern Demo Login
                  </button>
                  <p className="text-center text-xs text-[#A89E88] pt-2">
                    New applicant?{' '}
                    <button type="button" onClick={() => setView('register')} className="text-amber-400 hover:underline cursor-pointer">Apply free</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required className="input-cyber" />
                  <input type="tel" placeholder="WhatsApp phone" value={phone} onChange={e => setPhone(e.target.value)} required className="input-cyber" />
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="input-cyber" />
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="input-cyber" />

                  <div>
                    <label className="block text-xs font-mono text-[#A89E88] mb-1">Select Track</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setSelectedTrack('student')}
                        className={`p-2.5 rounded border text-xs font-medium cursor-pointer ${selectedTrack === 'student' ? 'border-amber-400 bg-amber-950/40 text-amber-300' : 'border-white/10 text-white/70'}`}>
                        Student Intern (₹5,000)
                      </button>
                      <button type="button" onClick={() => setSelectedTrack('housewife')}
                        className={`p-2.5 rounded border text-xs font-medium cursor-pointer ${selectedTrack === 'housewife' ? 'border-amber-400 bg-amber-950/40 text-amber-300' : 'border-white/10 text-white/70'}`}>
                        Community Lead (₹7,000)
                      </button>
                    </div>
                  </div>

                  <input type="text" placeholder="College or Apartment / Locality" value={orgCollege} onChange={e => setOrgCollege(e.target.value)} required className="input-cyber" />

                  <button type="submit" disabled={authLoading} className="btn-gold w-full py-3.5 text-xs uppercase tracking-wider cursor-pointer">
                    {authLoading ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <p className="text-center text-xs text-[#A89E88] pt-2">
                    Already enrolled?{' '}
                    <button type="button" onClick={() => setView('login')} className="text-amber-400 hover:underline cursor-pointer">Sign in</button>
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
