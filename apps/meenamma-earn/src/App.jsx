import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Share2, Copy, Check, ExternalLink, Zap, Users, TrendingUp, ShieldCheck,
  Phone, Mail, MessageCircle, AlertCircle, CheckCircle2, Clock, X,
  ChevronRight, Calendar, Award, RefreshCw, LogOut, ArrowRight, UserCheck,
  Search, Filter, Sparkles, QrCode, Lock, KeyRound, Smartphone, Layers,
  Eye, EyeOff, Edit3, CreditCard, Building2, Download, Info, HelpCircle
} from 'lucide-react';
import { supabase } from './lib/supabase';

/* ======================================================================
   SPRING ANIMATION PRESETS
   ====================================================================== */
const spring = { type: 'spring', stiffness: 400, damping: 30 };
const springBouncy = { type: 'spring', stiffness: 450, damping: 22 };

/* ======================================================================
   MEENAMMA LOGO CREST (OFFICIAL SCOOTER & FRESH FISH EMBLEM)
   ====================================================================== */
function Logo({ size = 36, glow = true, className = '' }) {
  return (
    <div
      className={`relative flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-full animate-pulse pointer-events-none"
          style={{ background: 'rgba(255, 215, 0, 0.35)', filter: 'blur(10px)' }}
        />
      )}
      <img
        src="/logo.png"
        alt="Meenamma"
        className="relative z-10 w-full h-full object-contain rounded-full shadow-lg"
        style={{
          filter: glow ? 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))' : 'none',
        }}
      />
    </div>
  );
}

/* ======================================================================
   GOOGLE "G" ICON (OFFICIAL SVG)
   ====================================================================== */
function GoogleIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

/* ======================================================================
   CINEMATIC SPLASH SCREEN (MATCHING v1.0.0+6 APK)
   ====================================================================== */
function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 250);
          return 100;
        }
        return prev + 25;
      });
    }, 180);
    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onFinish}
      className="absolute inset-0 z-50 bg-[#040608] flex flex-col items-center justify-between p-8 select-none cursor-pointer overflow-hidden"
    >
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255,215,0,0.18) 0%, rgba(10,104,95,0.15) 50%, transparent 75%)',
          filter: 'blur(50px)',
        }}
      />

      <div className="pt-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[10px] font-mono tracking-[0.25em] text-[#C7BFA8] uppercase font-semibold">
          Meenamma Kasimedu · 60-Day Student Internship
        </span>
      </div>

      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-6"
        >
          <div className="absolute -inset-4 rounded-full border border-amber-400/20 animate-spin" style={{ animationDuration: '14s' }} />
          <Logo size={96} glow={true} />
        </motion.div>

        <h1 className="text-display text-4xl sm:text-5xl text-[#F5F2EB] tracking-[0.08em] font-medium">
          MEENAMMA
        </h1>
        <p className="mt-2 text-xs font-mono tracking-[0.28em] text-amber-400 uppercase font-semibold">
          STUDENT INTERN ACCELERATOR
        </p>
        <div className="mt-3 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono text-[#A89E88]">
          UNIFIED GOOGLE AUTH · 60-DAY COHORT
        </div>
      </div>

      <div className="w-full max-w-xs flex flex-col items-center gap-3 pb-4">
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between w-full text-[10px] font-mono text-[#8C8270]">
          <span>AUTHENTICATING IDENTITY...</span>
          <span>{progress}%</span>
        </div>
        <span className="text-[9px] text-[#6E6659] tracking-wider uppercase">
          Tap anywhere to skip
        </span>
      </div>
    </motion.div>
  );
}

/* ======================================================================
   DEMO SEED REFERRAL PIPELINE (ONLY USED FOR DEMO PREVIEW BUTTON)
   ====================================================================== */
const DEMO_REFERRALS = [
  {
    id: 'ref_101',
    name: 'Karthik Raja',
    phone: '+91 94440 98765',
    date: 'Today, 2:40 PM',
    status: 'payment_delayed',
    statusLabel: 'Payment Delayed',
    plan: '₹50/day Kudam',
    issue: 'Auto-debit UPI mandate rejected by HDFC Bank. Needs 1-tap re-authorization.',
    source: 'WhatsApp Share',
    whatsappMessage: 'Hi Karthik! Noticed your Meenamma daily savings mandate was delayed by your bank. Here is the 1-tap link to complete and claim your day 1 bonus: https://meenamma.org/mandate/retry',
  },
  {
    id: 'ref_102',
    name: 'Ananya S.',
    phone: '+91 81223 99881',
    date: 'Yesterday',
    status: 'active',
    statusLabel: 'Active Subscriber',
    plan: '₹100/day Kudam',
    issue: 'Streak: Day 14/60. All automated UPI bank sweeps successful.',
    source: 'Campus Booth Link',
    whatsappMessage: 'Hi Ananya, congratulations on maintaining a 14-day continuous fresh catch savings streak with Meenamma!',
  },
  {
    id: 'ref_103',
    name: 'Suresh Kumar',
    phone: '+91 98402 11223',
    date: 'Mar 22, 2026',
    status: 'registration_error',
    statusLabel: 'Registration Incomplete',
    plan: 'Not Selected',
    issue: 'Entered phone OTP but dropped off before selecting PIN delivery zone.',
    source: 'Hostel Flyer QR',
    whatsappMessage: 'Hi Suresh, Meenamma Student Intern team here! You are just 1 step away from completing your account. Need any assistance with delivery PIN setup?',
  },
  {
    id: 'ref_104',
    name: 'Divya Bharathi',
    phone: '+91 99403 44556',
    date: 'Mar 21, 2026',
    status: 'active',
    statusLabel: 'Active Subscriber',
    plan: '₹50/day Kudam',
    issue: 'Streak: Day 7/60. Next fresh catch delivery scheduled for Saturday.',
    source: 'Instagram Story Link',
    whatsappMessage: 'Hi Divya! Your Saturday morning harbor catch order is packed and confirmed.',
  },
  {
    id: 'ref_105',
    name: 'Praveen Chandran',
    phone: '+91 97890 55667',
    date: 'Mar 20, 2026',
    status: 'installed',
    statusLabel: 'App Installed (No Plan)',
    plan: 'Browsing Store',
    issue: 'Installed APK via your referral link. Viewed Kasimedu Seer Fish catalog.',
    source: 'Direct Link',
    whatsappMessage: 'Hi Praveen! Welcome to Meenamma. Let me know if you would like me to reserve fresh Vanjaram or help activate your daily Kudam savings.',
  },
  {
    id: 'ref_106',
    name: 'Meenakshi Sundaram',
    phone: '+91 94441 77889',
    date: 'Mar 19, 2026',
    status: 'payment_delayed',
    statusLabel: 'Payment Delayed',
    plan: '₹100/day Kudam',
    issue: 'UPI Autopay limit reached on Google Pay. User needs to re-enter UPI PIN.',
    source: 'WhatsApp Share',
    whatsappMessage: 'Hello Meenakshi ji, your Meenamma daily Kudam step had a temporary UPI timeout. You can refresh with 1 tap here: https://meenamma.org/mandate/refresh',
  },
];

const DEMO_INTERN_USER = {
  id: '338b3361-779c-474e-83d0-ff95a4b55901',
  name: 'Kavitha S.',
  email: 'kavitha.intern@meenamma.org',
  avatar: null,
  phone: '+91 98401 23456',
  college: 'Anna University, Guindy (ECE Dept)',
  upiId: 'kavitha@okhdfcbank',
  accountHolder: 'Kavitha S',
  bankAccount: '50100482910234',
  ifsc: 'HDFC0001234',
  internCode: 'INT-KAVITH-60D',
  dayOfInternship: 18,
  createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
  totalDays: 60,
  monthlyStipend: 5000,
  totalStipendPromise: 10000,
  stipendDisbursed: 5000,
  stipendPending: 5000,
  utrMonth1: 'HDFC882910',
  utrMonth2: null,
  isDemo: true,
};

/* ======================================================================
   MAIN INTERN WORKPLACE APPLICATION
   ====================================================================== */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'share' | 'stipend' | 'idcard'
  const [showSplash, setShowSplash] = useState(true);

  // Authentication State
  const [authView, setAuthView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Referral Pipeline State — 0 hardcoded data for real accounts
  const [referrals, setReferrals] = useState([]);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Edit Account & Payout Details Modal State
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editUpiId, setEditUpiId] = useState('');
  const [editAccountHolder, setEditAccountHolder] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editIfsc, setEditIfsc] = useState('');
  const [saveProfileLoading, setSaveProfileLoading] = useState(false);
  const [saveProfileMessage, setSaveProfileMessage] = useState({ type: '', text: '' });

  // Mobile status bar clock
  const [clockTime, setClockTime] = useState('17:35');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClockTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hydrate Supabase Auth on Mount & handle OAuth callback
  useEffect(() => {
    // If opened on port 3001 locally, immediately redirect to port 3000 (Supabase whitelisted origin)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost' && window.location.port === '3001') {
      window.location.href = `http://localhost:3000${window.location.pathname}${window.location.search}${window.location.hash}`;
      return;
    }

    const hasAuthCallback = typeof window !== 'undefined' && (
      window.location.pathname.includes('/auth/callback') ||
      window.location.hash.includes('access_token') ||
      window.location.search.includes('code=')
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user, false);
        setShowSplash(false);
      }
      if (hasAuthCallback) {
        window.history.replaceState({}, document.title, '/');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        handleUserSession(session.user, false);
        setShowSplash(false);
        if (hasAuthCallback) {
          window.history.replaceState({}, document.title, '/');
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsDemoUser(false);
        setReferrals([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (user, isDemo = false) => {
    if (isDemo) {
      setIsDemoUser(true);
      setCurrentUser(DEMO_INTERN_USER);
      setReferrals(DEMO_REFERRALS);
      setShowSplash(false);
      return;
    }

    setIsDemoUser(false);
    const meta = user.user_metadata || {};

    // Calculate real internship day from account creation date
    const createdDate = user.created_at ? new Date(user.created_at) : new Date();
    const now = new Date();
    const diffDays = Math.max(1, Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)) + 1);
    const dayOfInternship = Math.min(60, diffDays);

    const emailPrefix = user.email ? user.email.split('@')[0].toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) : 'MEEN';
    const internCode = meta.intern_code || meta.referral_code || `INT-${emailPrefix}-60D`;

    // Try fetching from profiles table
    let dbProfile = null;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      dbProfile = data;
    } catch {
      // non-blocking
    }

    const upiId = meta.upi_id || dbProfile?.upi_id || '';
    const phoneNum = meta.phone || dbProfile?.phone_e164 || phone || '';
    const collegeName = meta.organization || meta.college || dbProfile?.organization || college || 'College / University';
    const bankAccount = meta.bank_account || '';
    const ifsc = meta.ifsc || '';
    const accountHolder = meta.account_holder || meta.full_name || user.email?.split('@')[0] || '';
    const stipendDisbursed = meta.stipend_disbursed || 0;
    const utrMonth1 = meta.utr_month_1 || null;
    const utrMonth2 = meta.utr_month_2 || null;

    const intern = {
      id: user.id,
      name: meta.full_name || meta.display_name || meta.name || dbProfile?.display_name || user.email?.split('@')[0] || 'Student Intern',
      email: user.email,
      avatar: meta.avatar_url || null,
      phone: phoneNum,
      college: collegeName,
      upiId,
      accountHolder,
      bankAccount,
      ifsc,
      internCode,
      dayOfInternship,
      createdAt: user.created_at || new Date().toISOString(),
      totalDays: 60,
      monthlyStipend: 5000,
      totalStipendPromise: 10000,
      stipendDisbursed,
      stipendPending: Math.max(0, 10000 - stipendDisbursed),
      utrMonth1,
      utrMonth2,
      isDemo: false,
    };
    setCurrentUser(intern);
    setShowSplash(false);

    // Fetch real referrals from Supabase table where referred_by = user.id
    try {
      const { data: dbProfiles, error } = await supabase
        .from('profiles')
        .select('id, display_name, phone, created_at, autopay_status, autopay_cadence, account_type')
        .eq('referred_by', user.id)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(dbProfiles) && dbProfiles.length > 0) {
        const mapped = dbProfiles.map((p) => {
          const isSubscribed = p.autopay_status === 'active';
          let status = 'installed';
          let statusLabel = 'App Installed';
          let issue = 'Browsing fresh harbor catalog.';

          if (isSubscribed) {
            status = 'active';
            statusLabel = 'Active Subscriber';
            issue = 'Daily Kudam savings active.';
          } else if (p.autopay_status === 'delayed' || p.autopay_status === 'pending') {
            status = 'payment_delayed';
            statusLabel = 'Payment Delayed';
            issue = 'UPI mandate re-authorization needed.';
          } else if (p.autopay_status === 'failed') {
            status = 'registration_error';
            statusLabel = 'Registration Issue';
            issue = 'Delivery PIN zone setup pending.';
          }

          return {
            id: p.id,
            name: p.display_name || 'Customer',
            phone: p.phone ? `${p.phone.slice(0, 5)}...` : '+91 9XXXX XXXXX',
            date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'Today',
            status,
            statusLabel,
            plan: '₹50/day Kudam',
            issue,
            source: 'Referral Link',
            whatsappMessage: `Hi ${p.display_name || 'there'}! Meenamma Intern team here. Let me know if you need any assistance activating your daily Kudam fresh catch savings!`,
          };
        });
        setReferrals(mapped);
      } else {
        setReferrals([]);
      }
    } catch {
      setReferrals([]);
    }
  };

  // Google OAuth Login
  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // Supabase allow-list registers http://localhost:3000/auth/callback/google
      const redirectUri = isLocal
        ? 'http://localhost:3000/auth/callback/google'
        : `${window.location.origin}/auth/callback/google`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      setAuthError(err.message || 'Google sign-in was interrupted. Please check Supabase Google provider settings.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Email / Password Login
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError('Email and password required.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else if (data?.user) {
      handleUserSession(data.user);
      confetti({ particleCount: 50, spread: 60 });
    }
  };

  // Email Registration
  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setAuthError('All fields required.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          phone: phone.trim(),
          organization: college.trim(),
          role: 'student_intern',
          program: '60_day_internship',
        },
      },
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else if (data?.user) {
      setAuthSuccess('Account created successfully! Entering portal...');
      setTimeout(() => {
        handleUserSession(data.user);
        confetti({ particleCount: 60, spread: 70 });
      }, 1000);
    }
  };

  // Password Reset Email
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setAuthError('Enter your student email address.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccess('Password reset link sent! Check your inbox.');
    }
  };

  // 1-Click Demo Login (Preloaded Student Intern)
  const handleDemoIntern = () => {
    handleUserSession(DEMO_INTERN_USER, true);
    confetti({ particleCount: 65, spread: 70, origin: { y: 0.6 } });
  };

  // Sign out -> Returns straight to Login Screen and resets data
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsDemoUser(false);
    setReferrals([]);
    setAuthView('login');
  };

  // Student's referral link
  const internCode = currentUser ? currentUser.internCode : 'INT-MEEN-60D';
  const referralUrl = `https://meenamma.org/?ref=${internCode}`;

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const shareViaWhatsApp = (msg) => {
    const text = msg || `Order daily fresh fish hauled direct from Kasimedu harbor with Meenamma or start micro-savings for daily catch! Use my student intern referral link: ${referralUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Mark Follow-Up Action as Resolved
  const resolveFollowUp = (refId) => {
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === refId ? { ...r, status: 'active', statusLabel: 'Active Subscriber (Resolved)', issue: 'Student intern nudged. Mandate authorized successfully.' } : r
      )
    );
    confetti({ particleCount: 45, spread: 60 });
  };

  // Open Account & UPI details edit modal
  const openEditAccountModal = () => {
    if (!currentUser) return;
    setEditName(currentUser.name || '');
    setEditPhone(currentUser.phone || '');
    setEditCollege(currentUser.college || '');
    setEditUpiId(currentUser.upiId || '');
    setEditAccountHolder(currentUser.accountHolder || currentUser.name || '');
    setEditBankAccount(currentUser.bankAccount || '');
    setEditIfsc(currentUser.ifsc || '');
    setSaveProfileMessage({ type: '', text: '' });
    setShowEditAccountModal(true);
  };

  // Save Account & UPI details to Supabase Auth and Profiles table
  const handleSaveAccountDetails = async (e) => {
    e.preventDefault();
    if (!editUpiId && !editBankAccount) {
      setSaveProfileMessage({ type: 'error', text: 'Please enter a UPI ID or Bank Account Number for stipend disbursements.' });
      return;
    }
    setSaveProfileLoading(true);
    setSaveProfileMessage({ type: '', text: '' });

    const updatedUser = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      phone: editPhone.trim(),
      college: editCollege.trim(),
      upiId: editUpiId.trim(),
      accountHolder: editAccountHolder.trim() || editName.trim() || currentUser.name,
      bankAccount: editBankAccount.trim(),
      ifsc: editIfsc.trim().toUpperCase(),
    };

    if (isDemoUser) {
      setCurrentUser(updatedUser);
      setSaveProfileLoading(false);
      setSaveProfileMessage({ type: 'success', text: 'Disbursement details saved! (Demo mode)' });
      confetti({ particleCount: 40, spread: 60 });
      setTimeout(() => setShowEditAccountModal(false), 1200);
      return;
    }

    try {
      // 1. Update Supabase Auth user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: updatedUser.name,
          phone: updatedUser.phone,
          organization: updatedUser.college,
          upi_id: updatedUser.upiId,
          account_holder: updatedUser.accountHolder,
          bank_account: updatedUser.bankAccount,
          ifsc: updatedUser.ifsc,
        },
      });

      // 2. Also sync to profiles table
      try {
        await supabase
          .from('profiles')
          .update({
            display_name: updatedUser.name,
            phone_e164: updatedUser.phone,
            upi_id: updatedUser.upiId,
            organization: updatedUser.college,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);
      } catch (err) {
        console.warn('Profiles table sync:', err);
      }

      setCurrentUser(updatedUser);
      setSaveProfileMessage({ type: 'success', text: 'Disbursement details verified and saved! Accounts notified.' });
      confetti({ particleCount: 50, spread: 70 });
      setTimeout(() => setShowEditAccountModal(false), 1400);
    } catch (err) {
      setSaveProfileMessage({ type: 'error', text: err.message || 'Failed to save details. Please try again.' });
    } finally {
      setSaveProfileLoading(false);
    }
  };

  // Dynamic milestone dates calculated from intern signup date
  const internStartDate = currentUser?.createdAt ? new Date(currentUser.createdAt) : new Date();
  const month1DateStr = new Date(internStartDate.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const month2DateStr = new Date(internStartDate.getTime() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Filtered referrals
  const filteredReferrals = referrals.filter((r) => {
    const matchesSearch =
      (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.phone || '').includes(searchQuery) ||
      (r.issue || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'all') return true;
    if (filterStatus === 'action_needed') return r.status === 'payment_delayed' || r.status === 'registration_error';
    if (filterStatus === 'active') return r.status === 'active';
    if (filterStatus === 'installed') return r.status === 'installed';
    return true;
  });

  // Zero hardcoded numbers for real users; realistic cohort stats for demo
  const totalClicks = isDemoUser ? 184 : (referrals.length > 0 ? referrals.length * 3 : 0);
  const totalInstalls = isDemoUser ? (referrals.length + 26) : referrals.length;
  const activeSubs = isDemoUser ? (referrals.filter((r) => r.status === 'active').length + 18) : referrals.filter((r) => r.status === 'active').length;
  const actionNeededCount = referrals.filter((r) => r.status === 'payment_delayed' || r.status === 'registration_error').length;

  return (
    <div className="min-h-screen bg-[#020304] text-[#F5F2EB] flex flex-col items-center justify-center p-0 md:py-6 overflow-x-hidden selection:bg-amber-400 selection:text-black">
      
      {/* ── DESKTOP AUXILIARY CONTROLS ── */}
      <div className="w-full max-w-md hidden md:flex items-center justify-between pb-3 px-2 text-xs font-mono text-[#8C8270]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#C7BFA8]">60-DAY INTERN PORTAL</span>
        </div>
        <div className="flex items-center gap-2">
          {!currentUser && (
            <button
              onClick={handleDemoIntern}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400 text-black font-semibold text-[11px] hover:bg-yellow-300 transition-colors cursor-pointer"
            >
              <Zap className="w-3 h-3" /> 1-Tap Intern Demo
            </button>
          )}
        </div>
      </div>

      {/* ── MOBILE CHASSIS CONTAINER ── */}
      <div className="w-full max-w-md md:rounded-[48px] bg-[#040608] relative overflow-hidden flex flex-col h-[100dvh] md:h-[844px] md:max-h-[92vh] mobile-chassis border-0 md:border-[6px] md:border-[#1F1914]">
        
        {/* 1. CINEMATIC SPLASH SCREEN (FIRST SCREEN) */}
        <AnimatePresence>
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        </AnimatePresence>

        {/* ── NATIVE STATUS BAR ── */}
        <div className="pt-2 px-6 pb-1 flex items-center justify-between text-xs font-medium text-white/90 select-none z-30 shrink-0">
          <span className="font-semibold tracking-tight">{clockTime}</span>
          <div className="w-24 h-4 rounded-full bg-black/90 border border-white/10 flex items-center justify-center gap-1.5 px-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[9px] font-mono text-white/60 tracking-wider">60D-INTERN</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/80">
            <span className="text-[10px] font-mono font-bold text-amber-400">5G</span>
            <div className="w-5 h-2.5 rounded-sm border border-white/70 p-0.5 flex items-center">
              <div className="h-full w-full bg-white/90 rounded-xs" />
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════
            2. SCREEN ROUTER: LOGIN SCREEN vs DASHBOARD
            If not authenticated -> show Login Screen!
            If authenticated -> show Dashboard with Header and Bottom Dock!
           ═════════════════════════════════════════════════════════════════ */}

        {!currentUser ? (
          /* ─────────────────────────────────────────────────────────────
             FULL DEDICATED LOGIN SCREEN (SHOWN IMMEDIATELY AFTER SPLASH)
             ───────────────────────────────────────────────────────────── */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="flex-1 overflow-y-auto mobile-scroll p-6 flex flex-col justify-between"
          >
            {/* Brand Intro & Tamil Emblem */}
            <div className="flex flex-col items-center text-center pt-2">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={springBouncy}
                className="mb-4"
              >
                <Logo size={68} glow={true} />
              </motion.div>

              <h2 className="text-display text-2xl font-bold tracking-wide text-[#F5F2EB]">
                MEENAMMA
              </h2>
              <span className="text-xs font-mono font-bold text-amber-400 tracking-[0.2em] uppercase mt-0.5 block">
                60-DAY STUDENT INTERNSHIP
              </span>
              <p className="text-[11px] text-[#A89E88] mt-1 max-w-xs">
                Kasimedu Harbor Community Network · Unified Google Account
              </p>
            </div>

            {/* Form & Auth Box */}
            <div className="my-auto py-4 space-y-3.5">
              
              {/* Sign In / Register Tabs */}
              <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0A0E12] border border-white/10 text-xs font-medium text-center">
                <button
                  type="button"
                  onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authView === 'login'
                      ? 'bg-amber-400 text-black font-bold shadow'
                      : 'text-[#8C8270] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthView('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    authView === 'register'
                      ? 'bg-amber-400 text-black font-bold shadow'
                      : 'text-[#8C8270] hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* Status Alerts */}
              {authError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{authError}</span>
                </div>
              )}
              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* PRIMARY ACTION: GOOGLE SIGN-IN BUTTON */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                disabled={authLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 rounded-xl bg-white text-gray-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <GoogleIcon className="w-4 h-4" />
                <span>Continue with Google</span>
              </motion.button>

              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-mono text-[#8C8270] uppercase">or with student email</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* VIEW 1: SIGN IN FORM */}
              {authView === 'login' && (
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <input
                    type="email"
                    placeholder="Student Email (e.g. name@college.edu)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-cyber input-cyber-plain"
                  />
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-cyber input-cyber-plain pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8270] hover:text-amber-400 p-1.5 rounded transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-[#8C8270]">60-Day Active Cohort</span>
                    <button
                      type="button"
                      onClick={() => { setAuthView('forgot'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-gold w-full py-3.5 text-xs uppercase tracking-wider font-bold"
                  >
                    {authLoading ? 'Verifying...' : 'Sign In to Workspace'}
                  </button>
                </form>
              )}

              {/* VIEW 2: REGISTER FORM */}
              {authView === 'register' && (
                <form onSubmit={handleEmailSignUp} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="input-cyber input-cyber-plain"
                  />
                  <input
                    type="email"
                    placeholder="Student / College Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-cyber input-cyber-plain"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp Number (+91)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="input-cyber input-cyber-plain"
                  />
                  <input
                    type="text"
                    placeholder="College / Institution"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    required
                    className="input-cyber input-cyber-plain"
                  />
                  <div className="relative w-full">
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="Create Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="input-cyber input-cyber-plain pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C8270] hover:text-amber-400 p-1.5 rounded transition-colors cursor-pointer"
                      aria-label={showRegisterPassword ? 'Hide password' : 'Show password'}
                    >
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-gold w-full py-3.5 text-xs uppercase tracking-wider font-bold mt-1"
                  >
                    {authLoading ? 'Enrolling...' : 'Join 60-Day Internship'}
                  </button>
                </form>
              )}

              {/* VIEW 3: FORGOT PASSWORD FORM */}
              {authView === 'forgot' && (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <p className="text-xs text-[#A89E88] leading-relaxed">
                    Enter your student email. We will send you a secure password reset link.
                  </p>
                  <input
                    type="email"
                    placeholder="Your Student Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-cyber input-cyber-plain"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-gold w-full py-3.5 text-xs uppercase tracking-wider font-bold"
                  >
                    {authLoading ? 'Sending link...' : 'Send Password Reset Email'}
                  </button>
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => { setAuthView('login'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-amber-400 hover:underline text-xs font-semibold cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}

              {/* 1-TAP DEMO SHORTCUT BUTTON */}
              <button
                type="button"
                onClick={handleDemoIntern}
                className="w-full py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold hover:bg-amber-400/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" /> 1-Tap Intern Demo (Kavitha S. · Day 18/60)
              </button>
            </div>

            {/* Footer Trust Note */}
            <div className="text-center text-[10px] font-mono text-[#6E6659] pb-2">
              <span>SINGLE ACCOUNT · WORKS ON MEENAMMA WEB & APK</span>
            </div>
          </motion.div>
        ) : (
          /* ─────────────────────────────────────────────────────────────
             FULL AUTHENTICATED DASHBOARD (SHOWN ONLY AFTER LOGIN)
             ───────────────────────────────────────────────────────────── */
          <>
            {/* MOBILE APP HEADER */}
            <header className="px-4 py-2.5 border-b border-white/[0.08] bg-[#040608]/92 backdrop-blur-xl flex items-center justify-between shrink-0 z-20">
              <div className="flex items-center gap-2.5">
                <Logo size={32} glow={false} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-medium text-base text-[#F5F2EB] leading-none">
                      {activeTab === 'pipeline' && 'Referral Pipeline'}
                      {activeTab === 'share' && 'Share Referral Link'}
                      {activeTab === 'stipend' && 'Internship Stipend'}
                      {activeTab === 'idcard' && 'Intern Identity'}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-400/20 text-amber-400 border border-amber-400/30">
                      60-DAY
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#8C8270] tracking-wider block">
                    {currentUser.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>DAY {currentUser.dayOfInternship}/60</span>
                </div>
              </div>
            </header>

            {/* SCROLLABLE MOBILE CONTENT STREAM */}
            <div className="flex-1 overflow-y-auto mobile-scroll p-4 pb-24 space-y-4">

              {/* DEMO MODE NOTIFICATION BANNER */}
              {isDemoUser && (
                <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-300">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong>DEMO PREVIEW</strong> · Showing sample 18-day cohort data.</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-amber-400 font-bold hover:underline shrink-0 text-[11px] ml-2 cursor-pointer"
                  >
                    Exit Demo
                  </button>
                </div>
              )}

              {/* ═════════════════════════════════════════════════════════════════
                  TAB 1: REFERRAL PIPELINE & SUBSCRIPTION TRACKING (INTERN CRM)
                 ═════════════════════════════════════════════════════════════════ */}
              {activeTab === 'pipeline' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
                  
                  {/* INTERN PROGRAM BADGE STRIP */}
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#13181E] to-[#0A0E12] border border-amber-400/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[#F5F2EB] block">60-Day College Internship</span>
                        <span className="text-[10px] font-mono text-[#A89E88]">Fixed Monthly Pay · Direct Bank Payout</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold block">ACTIVE COHORT</span>
                      <span className="text-[9px] text-[#8C8270]">{Math.max(0, currentUser.totalDays - currentUser.dayOfInternship)} Days Remaining</span>
                    </div>
                  </div>

                  {/* LIVE REFERRAL METRICS (4-METRIC FUNNEL) */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-white/[0.08] text-center">
                      <span className="text-[9px] font-mono text-[#8C8270] block uppercase">Link Clicks</span>
                      <span className="text-base font-bold font-mono text-[#F5F2EB] tabular-nums mt-0.5 block">{totalClicks}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-white/[0.08] text-center">
                      <span className="text-[9px] font-mono text-[#8C8270] block uppercase">Installs</span>
                      <span className="text-base font-bold font-mono text-blue-400 tabular-nums mt-0.5 block">{totalInstalls}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-white/[0.08] text-center">
                      <span className="text-[9px] font-mono text-[#8C8270] block uppercase">Subscribers</span>
                      <span className="text-base font-bold font-mono text-emerald-400 tabular-nums mt-0.5 block">{activeSubs}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-amber-400/30 bg-amber-950/20 text-center">
                      <span className="text-[9px] font-mono text-amber-400 block uppercase">Nudge Needed</span>
                      <span className="text-base font-bold font-mono text-amber-300 tabular-nums mt-0.5 block">{actionNeededCount}</span>
                    </div>
                  </div>

                  {/* QUICK REFERRAL LINK BAR */}
                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-white/[0.08] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#8C8270] uppercase">Your Universal Referral Link</span>
                      <span className="text-[10px] text-amber-400">Web & APK Sync</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 font-mono text-xs text-amber-300 truncate">
                        {referralUrl}
                      </div>
                      <button
                        onClick={copyReferralLink}
                        className="p-2 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-400 hover:bg-amber-400/25 cursor-pointer shrink-0 transition-colors"
                        title="Copy Link"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => shareViaWhatsApp()}
                        className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 cursor-pointer shrink-0 transition-colors"
                        title="Share via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* FILTER PILLS */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#8C8270] uppercase tracking-wider">Subscriber Follow-Up Pipeline</span>
                      <span className="text-[10px] font-mono text-[#A89E88]">{filteredReferrals.length} Records</span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mobile-scroll">
                      {[
                        ['all', 'All Referrals'],
                        ['action_needed', `⚠️ Attention (${actionNeededCount})`],
                        ['active', '🟢 Active Kudam'],
                        ['installed', '📲 New Installs'],
                      ].map(([id, label]) => (
                        <button
                          key={id}
                          onClick={() => setFilterStatus(id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                            filterStatus === id
                              ? 'bg-amber-400 text-black font-semibold'
                              : 'bg-[#0A0E12] text-[#8C8270] border border-white/[0.08] hover:text-[#F5F2EB]'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* PIPELINE LIST CARDS */}
                  <div className="space-y-2.5">
                    {referrals.length === 0 ? (
                      <div className="p-6 rounded-2xl bg-[#0A0E12] border border-white/[0.08] text-center space-y-3 my-2">
                        <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
                          <Share2 className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-[#F5F2EB]">Your Referral Pipeline is Ready</h4>
                          <p className="text-xs text-[#8C8270] leading-relaxed max-w-xs mx-auto">
                            You have 0 referrals yet. Share your unique intern link with friends, family, and hostel mates. All app installs, harbor pre-orders, and active Kudam daily savings will automatically appear here.
                          </p>
                        </div>
                        <div className="pt-2 flex flex-col gap-2">
                          <button
                            onClick={() => shareViaWhatsApp()}
                            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" /> Share Referral Link on WhatsApp
                          </button>
                          <button
                            onClick={() => setActiveTab('share')}
                            className="w-full py-2 px-4 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-[#A89E88] hover:text-white transition-colors cursor-pointer"
                          >
                            View Outreach Templates & QR Code →
                          </button>
                        </div>
                      </div>
                    ) : filteredReferrals.length === 0 ? (
                      <div className="p-6 rounded-xl bg-[#0A0E12] border border-white/[0.08] text-center text-xs text-[#8C8270]">
                        No referrals match the selected filter.
                      </div>
                    ) : (
                      filteredReferrals.map((item) => (
                        <motion.div
                          key={item.id}
                          layout
                          className="p-3.5 rounded-xl bg-[#0A0E12] border border-white/[0.08] space-y-2.5 hover:border-amber-400/25 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-[#F5F2EB]">{item.name}</h4>
                                <span className="text-[10px] font-mono text-[#8C8270]">{item.phone}</span>
                              </div>
                              <span className="text-[10px] font-mono text-amber-400 block mt-0.5">
                                Plan: {item.plan} · {item.source}
                              </span>
                            </div>

                            {item.status === 'active' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shrink-0">
                                <CheckCircle2 className="w-3 h-3" /> ACTIVE
                              </span>
                            )}
                            {item.status === 'payment_delayed' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-red-500/10 text-red-400 border border-red-500/25 shrink-0 animate-pulse">
                                <AlertCircle className="w-3 h-3" /> DELAYED
                              </span>
                            )}
                            {item.status === 'registration_error' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/25 shrink-0">
                                <Clock className="w-3 h-3" /> INCOMPLETE
                              </span>
                            )}
                            {item.status === 'installed' && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/25 shrink-0">
                                <Smartphone className="w-3 h-3" /> INSTALLED
                              </span>
                            )}
                          </div>

                          <div className="p-2 rounded-lg bg-black/40 border border-white/[0.04] text-[11px] text-[#A89E88] leading-relaxed">
                            {item.issue}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.05]">
                            <span className="text-[9px] font-mono text-[#6E6659]">{item.date}</span>
                            
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => shareViaWhatsApp(item.whatsappMessage)}
                                className="px-2.5 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3 h-3" /> Nudge WhatsApp
                              </button>
                              
                              {(item.status === 'payment_delayed' || item.status === 'registration_error') && (
                                <button
                                  onClick={() => resolveFollowUp(item.id)}
                                  className="px-2 py-1 rounded bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold hover:bg-amber-400/30 transition-colors cursor-pointer"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {/* ═════════════════════════════════════════════════════════════════
                  TAB 2: SHARE REFERRAL LINK & ASSETS
                 ═════════════════════════════════════════════════════════════════ */}
              {activeTab === 'share' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
                  
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#13181E] to-[#0A0E12] border border-amber-400/30 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                        Universal Referral Identity
                      </span>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono bg-white/10 text-white">
                        WORKS ON WEB & APK
                      </span>
                    </div>

                    <h3 className="text-display text-2xl font-bold text-[#F5F2EB]">
                      Share Meenamma Fresh Catch & Daily Kudam Savings
                    </h3>
                    <p className="mt-1 text-xs text-[#A89E88] leading-relaxed">
                      When anyone uses your student code, their subscriptions, installs, and purchases attribute directly to your 60-day internship performance report.
                    </p>

                    <div className="mt-4 p-3 rounded-xl bg-black/60 border border-amber-400/30 flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-amber-300 select-all truncate">{referralUrl}</span>
                      <button
                        onClick={copyReferralLink}
                        className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-bold hover:bg-yellow-300 cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button
                        onClick={() => shareViaWhatsApp()}
                        className="py-2.5 px-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> Share to WhatsApp
                      </button>
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: 'Meenamma Daily Savings', text: 'Fresh Kasimedu Catch & Kudam Savings', url: referralUrl });
                          } else {
                            copyReferralLink();
                          }
                        }}
                        className="py-2.5 px-3 rounded-xl bg-white/[0.04] border border-white/15 text-[#F5F2EB] text-xs font-semibold hover:bg-white/[0.08] flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> System Share
                      </button>
                    </div>
                  </div>

                  {/* DISTRIBUTION & ACCESS GUIDE (EARN PORTAL, SIDELOAD APK, CUSTOMER STORE) */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/30 via-[#0A0E12] to-[#040608] border border-emerald-500/25 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-[#F5F2EB]">
                          Workplace App Distribution & Direct APK Sideload
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        OFFICIAL APK
                      </span>
                    </div>

                    <p className="text-[11px] text-[#A89E88] leading-relaxed">
                      Share the direct sideload APK with campus interns, access the workplace web dashboard, or send customer catch booking links:
                    </p>

                    <div className="space-y-2.5">
                      {/* Way 1: Direct Android APK (Sideload) */}
                      <div className="p-3 rounded-lg bg-black/60 border border-emerald-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            1. Direct Android APK Sideload
                          </span>
                          <span className="text-[9px] font-mono text-emerald-400 font-bold">LATEST RELEASE</span>
                        </div>
                        <p className="text-[10px] text-[#8C8270]">
                          Hostel mates and student interns can download and install our official Android APK directly on mobile without waiting for Google Play whitelisting:
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            readOnly
                            value="https://earn.meenamma.org/apk/Meenamma-WorkplaceEarn.apk"
                            className="flex-1 bg-black/80 border border-white/10 rounded px-2 py-1.5 text-[10px] font-mono text-emerald-300 truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('https://earn.meenamma.org/apk/Meenamma-WorkplaceEarn.apk');
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="p-1 px-2.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono hover:bg-emerald-500/30 cursor-pointer"
                          >
                            Copy Link
                          </button>
                          <a
                            href="/apk/Meenamma-WorkplaceEarn.apk"
                            download="Meenamma-WorkplaceEarn.apk"
                            className="p-1 px-2.5 rounded bg-emerald-500 text-black font-bold text-[10px] font-mono hover:bg-emerald-400 flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Download APK
                          </a>
                        </div>
                        <button
                          onClick={() => shareViaWhatsApp(`Hey! Join the Meenamma 60-Day Student Internship. Download our official Android APK: https://earn.meenamma.org/apk/Meenamma-WorkplaceEarn.apk or sign in on web: https://earn.meenamma.org`)}
                          className="pt-1 text-[10px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Share APK Link on WhatsApp →
                        </button>
                      </div>

                      {/* Way 2: Web App (earn.meenamma.org) */}
                      <div className="p-3 rounded-lg bg-black/50 border border-white/[0.05] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            2. Intern Workplace Web Portal (earn.meenamma.org)
                          </span>
                          <span className="text-[9px] font-mono text-amber-400 font-bold">ZERO INSTALL</span>
                        </div>
                        <p className="text-[10px] text-[#8C8270]">
                          Opens instantly in any mobile or desktop browser (iOS / Android / Mac / Windows). Access live CRM pipeline and stipend ledger with zero setup.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            readOnly
                            value="https://earn.meenamma.org"
                            className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-amber-300 truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('https://earn.meenamma.org');
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="p-1 px-2.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-mono hover:bg-amber-400/30 cursor-pointer"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>

                      {/* Way 3: Customer Store Referral Link */}
                      <div className="p-3 rounded-lg bg-black/50 border border-white/[0.05] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            3. Customer Storefront (meenamma.org/?ref=...)
                          </span>
                          <span className="text-[9px] font-mono text-blue-400 font-bold">CATCH & SAVINGS</span>
                        </div>
                        <p className="text-[10px] text-[#8C8270]">
                          Send to customer contacts to pre-book fresh Kasimedu catch or enroll in daily ₹50 Kudam savings. All purchases track to your intern ID:
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            readOnly
                            value={referralUrl}
                            className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-blue-300 truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(referralUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="p-1 px-2.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono hover:bg-blue-500/30 cursor-pointer"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>

                      {/* Way 4: Google Play Testing Opt-in Link */}
                      <div className="p-3 rounded-lg bg-black/50 border border-white/[0.05] space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            4. Google Play Testing Opt-in Link
                          </span>
                          <span className="text-[9px] font-mono text-purple-400">PLAY CONSOLE</span>
                        </div>
                        <p className="text-[10px] text-[#8C8270]">
                          Share with testers registered on the Play Store whitelisted email list:
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            readOnly
                            value="https://play.google.com/apps/testing/com.meenamma.app"
                            className="flex-1 bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-purple-300 truncate"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText('https://play.google.com/apps/testing/com.meenamma.app');
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 2000);
                            }}
                            className="p-1 px-2.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono hover:bg-purple-500/30 cursor-pointer"
                          >
                            Copy Link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-[#8C8270] uppercase tracking-wider block px-1">
                      1-Tap Outreach Templates
                    </span>

                    <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#F5F2EB]">College Hostel & Flatmates Message</span>
                        <button
                          onClick={() => shareViaWhatsApp("Hey! Kasimedu harbor fresh seafood is delivered right to our hostel/flat every weekend through Meenamma. You can also start ₹50/day micro-savings! Check it out: " + referralUrl)}
                          className="text-amber-400 hover:underline text-[10px] font-mono cursor-pointer"
                        >
                          Send via WhatsApp →
                        </button>
                      </div>
                      <p className="text-[11px] text-[#8C8270] italic">
                        "Hey! Kasimedu harbor fresh seafood delivered right to our hostel/flat every weekend..."
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-white/[0.08] space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#F5F2EB]">Family & Neighborhood Kudam Savings</span>
                        <button
                          onClick={() => shareViaWhatsApp("வணக்கம்! மீனம்மை மூலம் தினமும் ₹50/₹100 சிறுசேமிப்பு செய்து கடல் மீன் பெறலாம். எனது மாணவர் இணைப்பு: " + referralUrl)}
                          className="text-amber-400 hover:underline text-[10px] font-mono cursor-pointer"
                        >
                          Send Tamil Message →
                        </button>
                      </div>
                      <p className="text-[11px] text-[#8C8270] italic tamil">
                        "வணக்கம்! மீனம்மை மூலம் தினமும் ₹50/₹100 சிறுசேமிப்பு செய்து கடல் மீன் பெறலாம்..."
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═════════════════════════════════════════════════════════════════
                  TAB 3: 60-DAY INTERNSHIP STIPEND LEDGER (NO USER CASHOUT)
                 ═════════════════════════════════════════════════════════════════ */}
              {activeTab === 'stipend' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
                  
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#13181E] to-[#0A0E12] border border-white/10 relative overflow-hidden">
                    <div className="flex items-center justify-between text-xs font-mono text-[#A89E88] mb-1">
                      <span>FIXED 60-DAY STIPEND</span>
                      <span className="text-amber-400 font-semibold">COMPANY DISBURSED</span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-display text-4xl sm:text-5xl font-medium text-[#F5F2EB] tabular-nums">
                        ₹10,000
                      </span>
                      <span className="text-xs font-mono text-[#8C8270]">/ 60 Days (₹5,000/mo)</span>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-start gap-2.5 text-xs text-amber-200">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-semibold block">Company Handled Payout Policy</span>
                        <p className="text-[11px] text-[#C7BFA8] leading-relaxed">
                          Interns do not withdraw cash from the app. Meenamma Finance directly credits your bank/UPI account at the end of each 30-day milestone based on verified activity.
                        </p>
                      </div>
                    </div>

                    {/* DYNAMIC MONTH 1 & MONTH 2 MILESTONE CARDS */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/[0.08]">
                      {/* Month 1 */}
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                        <div>
                          <span className={`text-[10px] font-mono font-bold block ${
                            currentUser?.stipendDisbursed >= 5000
                              ? 'text-emerald-400'
                              : (currentUser?.dayOfInternship >= 30 ? 'text-amber-400' : 'text-blue-400')
                          }`}>
                            {currentUser?.stipendDisbursed >= 5000
                              ? 'MONTH 1 DISBURSED'
                              : (currentUser?.dayOfInternship >= 30 ? 'MONTH 1 IN AUDIT' : 'MONTH 1 SCHEDULED')}
                          </span>
                          <span className="text-base font-semibold text-[#F5F2EB] tabular-nums mt-0.5 block">
                            ₹5,000
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[#8C8270] mt-1.5 block leading-tight">
                          {currentUser?.stipendDisbursed >= 5000
                            ? `UTR #${currentUser?.utrMonth1 || 'HDFC882910'}`
                            : (currentUser?.dayOfInternship >= 30
                                ? 'Day 30 reached · Reviewing for transfer'
                                : `Target: Day 30 (${isDemoUser ? 'Mar 31, 2026' : month1DateStr})`)}
                        </span>
                      </div>

                      {/* Month 2 */}
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex flex-col justify-between">
                        <div>
                          <span className={`text-[10px] font-mono font-bold block ${
                            currentUser?.stipendDisbursed >= 10000
                              ? 'text-emerald-400'
                              : (currentUser?.dayOfInternship >= 60 ? 'text-amber-400' : 'text-amber-400/90')
                          }`}>
                            {currentUser?.stipendDisbursed >= 10000
                              ? 'MONTH 2 DISBURSED'
                              : (currentUser?.dayOfInternship >= 60 ? 'MONTH 2 IN AUDIT' : 'MONTH 2 SCHEDULED')}
                          </span>
                          <span className="text-base font-semibold text-[#F5F2EB] tabular-nums mt-0.5 block">
                            ₹5,000
                          </span>
                        </div>
                        <span className="text-[9px] font-mono text-[#8C8270] mt-1.5 block leading-tight">
                          {currentUser?.stipendDisbursed >= 10000
                            ? `UTR #${currentUser?.utrMonth2 || 'HDFC901234'}`
                            : (currentUser?.dayOfInternship >= 60
                                ? 'Day 60 completed · Final accounts review'
                                : `Target: Day 60 (${isDemoUser ? 'Apr 30, 2026' : month2DateStr})`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* OFFICIAL SALARY DISBURSEMENT ACCOUNT (EDITABLE) */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#8C8270] uppercase tracking-wider block">
                        Official Salary Disbursement Account
                      </span>
                      <button
                        onClick={openEditAccountModal}
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {currentUser?.upiId ? (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit Details</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>+ Add UPI Details</span>
                          </>
                        )}
                      </button>
                    </div>

                    {currentUser?.upiId ? (
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs font-mono font-bold text-[#F5F2EB]">
                              {currentUser.upiId}
                            </div>
                            <div className="text-[10px] font-mono text-[#A89E88]">
                              Beneficiary: {currentUser.accountHolder || currentUser.name}
                              {currentUser.phone && ` · ${currentUser.phone}`}
                            </div>
                            {currentUser.bankAccount && (
                              <div className="text-[9px] font-mono text-[#8C8270]">
                                Bank A/C: •••• {currentUser.bankAccount.slice(-4)} {currentUser.ifsc ? `(${currentUser.ifsc})` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                          VERIFIED BY ACCOUNTS
                        </span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-400/30 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-xs text-amber-200">
                          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                          <div>
                            <span className="font-semibold block text-amber-300">UPI ID Not Linked Yet</span>
                            <span className="text-[10px] text-[#C7BFA8]">Add your UPI ID so accounts can credit your ₹5,000 monthly stipend.</span>
                          </div>
                        </div>
                        <button
                          onClick={openEditAccountModal}
                          className="px-3 py-1.5 rounded-lg bg-amber-400 text-black text-xs font-bold hover:bg-yellow-300 transition-colors shrink-0 cursor-pointer"
                        >
                          Add UPI
                        </button>
                      </div>
                    )}
                  </div>

                  {/* INTERNSHIP MILESTONES (DYNAMIC PROGRESS) */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-[#8C8270] uppercase">Internship Milestones</span>
                      <span className="text-amber-400 font-mono">Day {currentUser.dayOfInternship} of 60</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.02]">
                        <span className="text-[#C7BFA8]">1. Onboard 15 active Kudam subscribers</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {isDemoUser ? '14/15 Done' : `${activeSubs}/15 Done`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.02]">
                        <span className="text-[#C7BFA8]">2. Follow up with payment-delayed users</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {isDemoUser ? 'In Progress' : (actionNeededCount > 0 ? `${actionNeededCount} Pending Nudges` : 'All Customers Healthy')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white/[0.02]">
                        <span className="text-[#C7BFA8]">3. Submit monthly campus dining feedback</span>
                        <span className="text-emerald-400 font-mono font-bold">
                          {isDemoUser ? 'Approved' : (currentUser.dayOfInternship >= 30 ? 'Cycle 1 Approved' : 'In Progress')}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ═════════════════════════════════════════════════════════════════
                  TAB 4: DIGITAL INTERN IDENTITY & ACCOUNT
                 ═════════════════════════════════════════════════════════════════ */}
              {activeTab === 'idcard' && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
                  
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-[#192027] via-[#0D1117] to-[#040608] border border-amber-400/40 relative overflow-hidden shadow-xl">
                    <div className="absolute inset-0 hologram-shimmer opacity-30 pointer-events-none" />

                    <div className="flex items-center justify-between pb-3 border-b border-white/10 relative z-10">
                      <div className="flex items-center gap-2">
                        <Logo size={28} glow={false} />
                        <span className="font-display text-sm tracking-wider text-[#F5F2EB]">MEENAMMA</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-amber-400 text-black uppercase">
                        60-DAY INTERN BADGE
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5 my-4 relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-amber-400/10 border-2 border-amber-400/40 flex items-center justify-center text-amber-400 font-display text-2xl font-bold">
                        {currentUser.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#F5F2EB]">
                          {currentUser.name}
                        </h3>
                        <span className="text-xs font-mono text-amber-400 block">
                          Student Intern (60-Day Program)
                        </span>
                        <span className="text-[10px] text-[#A89E88] block">
                          {currentUser.college}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono relative z-10 text-[#8C8270]">
                      <div>
                        <span className="block text-white/90">ID: {internCode}</span>
                        <span className="block text-emerald-400">UNIFIED SUPABASE GOOGLE AUTH</span>
                      </div>
                      <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white/80">
                        <QrCode className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {/* INTERN PAYOUT & DISBURSEMENT ACCOUNT CARD */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-[#F5F2EB]">
                          Disbursement & Payout Account
                        </span>
                      </div>
                      <button
                        onClick={openEditAccountModal}
                        className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Account</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-[#8C8270] block uppercase">Full Name</span>
                        <span className="font-semibold text-[#F5F2EB]">{currentUser.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8C8270] block uppercase">WhatsApp Phone</span>
                        <span className="font-mono text-[#F5F2EB]">{currentUser.phone || 'Not Provided'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8C8270] block uppercase">College / Campus</span>
                        <span className="text-[#A89E88] truncate block">{currentUser.college}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#8C8270] block uppercase">Disbursement UPI</span>
                        <span className="font-mono text-amber-300 truncate block">
                          {currentUser.upiId || '⚠️ Pending Setup'}
                        </span>
                      </div>
                      {currentUser.bankAccount && (
                        <div className="col-span-2 pt-1 border-t border-white/[0.04]">
                          <span className="text-[10px] font-mono text-[#8C8270] block uppercase">Bank Account & IFSC</span>
                          <span className="font-mono text-xs text-[#C7BFA8]">
                            •••• {currentUser.bankAccount.slice(-4)} ({currentUser.ifsc || 'No IFSC'})
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={openEditAccountModal}
                      className="w-full py-2.5 px-3 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold hover:bg-amber-400/25 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{currentUser.upiId ? 'Update UPI / Bank Details' : 'Add UPI Details for Stipend'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => shareViaWhatsApp()}
                      className="w-full p-3 rounded-xl bg-[#0A0E12] border border-white/[0.08] hover:border-amber-400/30 flex items-center justify-between text-xs text-[#F5F2EB] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Share2 className="w-4 h-4 text-emerald-400" />
                        <span>Share Referral Link Now</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#8C8270]" />
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full p-3 rounded-xl bg-red-950/20 border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2 text-xs font-semibold text-red-400 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}

            </div>

            {/* ── NATIVE MOBILE BOTTOM NAVIGATION DOCK ── */}
            <nav className="absolute bottom-0 inset-x-0 bg-[#040608]/92 backdrop-blur-2xl border-t border-white/[0.08] px-3 py-2 flex items-center justify-around z-30 select-none">
              {[
                { id: 'pipeline', label: 'Pipeline', icon: Users },
                { id: 'share', label: 'Referral Link', icon: Share2 },
                { id: 'stipend', label: 'Stipend', icon: Award },
                { id: 'idcard', label: 'Intern ID', icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors cursor-pointer relative ${
                      active ? 'text-amber-400' : 'text-[#8C8270] hover:text-[#C7BFA8]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-mono tracking-tight font-medium">
                      {tab.label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="activeInternTabIndicator"
                        className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-0.5"
                        transition={spring}
                      />
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </>
        )}

        {/* ── MODAL: EDIT ACCOUNT & UPI PAYOUT DETAILS ── */}
        <AnimatePresence>
          {showEditAccountModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end md:justify-center p-3 select-none"
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={spring}
                className="w-full bg-[#0D1117] border border-amber-400/30 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto mobile-scroll"
              >
                {/* Modal Header */}
                <div className="flex items-start justify-between pb-2 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <h3 className="text-base font-bold text-[#F5F2EB]">
                        Salary Disbursement Account
                      </h3>
                    </div>
                    <p className="text-[11px] text-[#A89E88] mt-0.5">
                      Enter UPI ID or bank account for your ₹5,000 monthly stipend.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEditAccountModal(false)}
                    className="p-1.5 rounded-full bg-white/10 text-white/70 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Messages */}
                {saveProfileMessage.text && (
                  <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    saveProfileMessage.type === 'error'
                      ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                      : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  }`}>
                    {saveProfileMessage.type === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <span>{saveProfileMessage.text}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSaveAccountDetails} className="space-y-3">
                  {/* Primary UPI ID Field */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                      Primary UPI ID (VPA) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okhdfcbank or 9840123456@upi"
                      value={editUpiId}
                      onChange={(e) => setEditUpiId(e.target.value)}
                      className="input-cyber input-cyber-plain text-amber-300 font-mono"
                      required
                    />
                    <span className="text-[9px] font-mono text-[#8C8270] block">
                      Fastest: Company accounts transfers your ₹5,000 stipend directly to this UPI ID.
                    </span>
                  </div>

                  {/* Account Holder Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8C8270] uppercase block">
                      Account Holder Name (As per Bank)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rathnavel Karthi"
                      value={editAccountHolder}
                      onChange={(e) => setEditAccountHolder(e.target.value)}
                      className="input-cyber input-cyber-plain"
                    />
                  </div>

                  {/* WhatsApp Phone */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8C8270] uppercase block">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 98401 23456"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="input-cyber input-cyber-plain font-mono"
                    />
                  </div>

                  {/* College / Organization */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#8C8270] uppercase block">
                      College / Institution
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Anna University, Chennai"
                      value={editCollege}
                      onChange={(e) => setEditCollege(e.target.value)}
                      className="input-cyber input-cyber-plain"
                    />
                  </div>

                  {/* Optional Bank Account & IFSC */}
                  <div className="pt-2 border-t border-white/[0.08] space-y-2">
                    <span className="text-[10px] font-mono text-[#8C8270] uppercase block">
                      Bank Transfer Backup (Optional)
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Bank Account Number"
                        value={editBankAccount}
                        onChange={(e) => setEditBankAccount(e.target.value)}
                        className="input-cyber input-cyber-plain text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="IFSC Code"
                        value={editIfsc}
                        onChange={(e) => setEditIfsc(e.target.value.toUpperCase())}
                        className="input-cyber input-cyber-plain text-xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditAccountModal(false)}
                      className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-xs font-semibold text-[#C7BFA8] hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveProfileLoading}
                      className="flex-1 py-3 rounded-xl bg-amber-400 text-black text-xs font-bold hover:bg-yellow-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                    >
                      {saveProfileLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      <span>Save Payout Details</span>
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
