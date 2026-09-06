import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  UserPlus, CheckCircle2, Award, Clock, TrendingUp,
  MapPin, Phone, ArrowRight, ExternalLink, Lock, Mail, User, Users,
  LogOut, Copy, Check, Trophy, Zap, Menu, X,
  Loader2, BadgeCheck, Star, ShieldCheck, Wallet, Calendar, Sparkles
} from 'lucide-react';
import { supabase } from './lib/supabase';
import {
  fetchSubscriberReferrals,
  addSubscriberReferral,
  requestReferralPayout,
  calculateMilestoneReward
} from './lib/referralSync';

/* ======================================================================
   MOTION TOKENS
   ====================================================================== */
const spring = { type: 'spring', stiffness: 340, damping: 24 };
const ease = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.48, ease } }
};

/* ======================================================================
   BRAND LOGO
   ====================================================================== */
function Logo({ size = 36 }) {
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full animate-pulse"
        style={{ background: 'rgba(16,185,129,0.15)', filter: 'blur(8px)' }} />
      <svg viewBox="0 0 60 60" style={{ width: size - 4, height: size - 4, position: 'relative', zIndex: 1 }}>
        {[...Array(8)].map((_, i) => (
          <path key={i} transform={`rotate(${i * 45}, 30, 30)`}
            d="M 30 5 Q 36 12 30 19 Q 24 12 30 5"
            fill="none" stroke="#10B981" strokeWidth="1.4" opacity="0.85" />
        ))}
        <circle cx="30" cy="30" r="13" fill="#059669" opacity="0.20" />
        <text x="30" y="37" textAnchor="middle" fill="#34D399" fontSize="15" fontWeight="bold" className="tamil">மீ</text>
      </svg>
    </div>
  );
}

/* ======================================================================
   LIVE BADGE
   ====================================================================== */
function LiveBadge({ children }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-mono text-[10px] font-semibold uppercase tracking-wider"
      style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {children}
    </div>
  );
}

/* ======================================================================
   MAIN APP
   ====================================================================== */
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'register' | 'forgot-password'
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'subscribers' | 'leaderboard' | 'link'

  // Auth form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Subscribers Pipeline State (Live Two-Way Sync)
  const [subscribers, setSubscribers] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [showAddSub, setShowAddSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubPhone, setNewSubPhone] = useState('');
  const [newSubPlan, setNewSubPlan] = useState(2); // ₹1, ₹2, ₹5
  const [addSubLoading, setAddSubLoading] = useState(false);

  // Payout Modal
  const [showPayout, setShowPayout] = useState(false);
  const [payoutUpi, setPayoutUpi] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // UI state
  const [copied, setCopied] = useState(false);

  // Scroll lock for modals
  useEffect(() => {
    document.body.style.overflow = (view === 'login' || view === 'register' || showAddSub || showPayout) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [view, showAddSub, showPayout]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) hydrate(session.user);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) hydrate(session.user);
      else {
        setCurrentUser(null);
        setSubscribers([]);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const hydrate = async (user) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const code = data?.referral_code || 'MREF' + user.id.substring(0, 4).toUpperCase();
      const userObj = {
        id: user.id,
        name: data?.display_name || user.user_metadata?.display_name || user.email.split('@')[0],
        email: user.email,
        phone: data?.phone_e164 || user.user_metadata?.phone || '',
        referral_code: code,
        upi: data?.upi_id || 'partner@okhdfcbank',
        tier: '100-Day Growth Partner',
      };
      setCurrentUser(userObj);
      loadLiveSubscribers(user.id, code);
    } catch {
      const fallbackCode = 'MREF' + user.id.substring(0, 4).toUpperCase();
      const userObj = {
        id: user.id,
        name: user.email.split('@')[0],
        email: user.email,
        phone: '',
        referral_code: fallbackCode,
        upi: 'partner@okhdfcbank',
        tier: '100-Day Growth Partner',
      };
      setCurrentUser(userObj);
      loadLiveSubscribers(user.id, fallbackCode);
    }
  };

  const loadLiveSubscribers = async (userId, code) => {
    setLoadingSubs(true);
    try {
      const list = await fetchSubscriberReferrals(userId, code);
      setSubscribers(list);
    } catch (e) {
      console.error('Failed to load subscribers:', e);
    } finally {
      setLoadingSubs(false);
    }
  };

  const handleDemoLogin = () => {
    const demoUser = {
      id: '338b3361-779c-474e-83d0-ff95a4b55901',
      name: 'Rathnavel Karthi (Partner)',
      email: 'rathnavelkarthi1@gmail.com',
      phone: '+918122348468',
      referral_code: 'RATH338B',
      upi: 'rathna@okhdfcbank',
      tier: '100-Day Lead Partner',
    };
    setCurrentUser(demoUser);
    loadLiveSubscribers(demoUser.id, demoUser.referral_code);
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
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
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
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
      options: { data: { display_name: name.trim(), phone: phone.trim(), account_type: 'subscriber_referrer' } }
    });
    setAuthLoading(false);
    if (error) { setAuthError(error.message); }
    else if (data?.session) {
      confetti({ particleCount: 90, spread: 90 });
      hydrate(data.user);
      setView('landing');
    }
    else { setAuthSuccess('Account created! Sign in to view your subscriber link.'); }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setSubscribers([]);
  };

  const handleCreateSubscriber = async (e) => {
    e.preventDefault();
    if (!newSubName || !newSubPhone) return;
    setAddSubLoading(true);
    try {
      await addSubscriberReferral({
        referrerId: currentUser.id,
        referrerCode: currentUser.referral_code,
        subscriberName: newSubName.trim(),
        subscriberPhone: newSubPhone.trim(),
        dailyPlan: newSubPlan,
      });
      setShowAddSub(false);
      setNewSubName('');
      setNewSubPhone('');
      confetti({ particleCount: 60, spread: 70 });
      await loadLiveSubscribers(currentUser.id, currentUser.referral_code);
    } catch (err) {
      alert(err.message);
    } finally {
      setAddSubLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!payoutUpi) return;
    setPayoutLoading(true);
    try {
      await requestReferralPayout({
        userId: currentUser.id,
        amountInr: unlockedRewards,
        upiId: payoutUpi.trim(),
      });
      setPayoutSuccess(true);
      setTimeout(() => {
        setPayoutSuccess(false);
        setShowPayout(false);
      }, 2000);
    } catch (e) {
      alert('Payout request failed.');
    } finally {
      setPayoutLoading(false);
    }
  };

  const referralLink = `https://meenamma.org/kudam?ref=${currentUser?.referral_code || 'RATH338B'}`;
  const copyLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    confetti({ particleCount: 50, spread: 65, origin: { y: 0.8 }, colors: ['#10B981', '#34D399', '#6EE7B7'] });
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculations based on the 100-Day Subscriber Rule
  const activeSubs = subscribers.filter(s => !s.isCompleted);
  const completedSubs = subscribers.filter(s => s.isCompleted);
  const lockedRewards = activeSubs.reduce((sum, s) => sum + s.rewardAmount, 0);
  const unlockedRewards = completedSubs.reduce((sum, s) => sum + s.rewardAmount, 0);
  const totalSubscribersCount = subscribers.length;

  return (
    <div className="min-h-screen ambient-glow-referrals text-[#F0FDF4] flex flex-col relative overflow-x-hidden">

      {/* ── STATUS BAR ── */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 text-[11px] font-mono border-b"
        style={{ background: 'rgba(5,9,8,0.85)', borderColor: 'rgba(16,185,129,0.12)', color: '#5F8373' }}>
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Meenamma 100-Day Subscriber Referral Program · Two-Way Cloud Sync Active</span>
        </div>
        <span>Milestone Rewards: ₹1/day &rarr; <strong className="text-emerald-400">₹200</strong> · ₹2/day &rarr; <strong className="text-emerald-400">₹400</strong> · ₹5/day &rarr; <strong className="text-emerald-400">₹600</strong></span>
      </div>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 border-b"
        style={{ background: 'rgba(5,9,8,0.94)', backdropFilter: 'blur(20px)', borderColor: 'rgba(16,185,129,0.12)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          <button className="flex items-center gap-3 cursor-pointer text-left" onClick={() => { if (!currentUser) setView('landing'); }}>
            <Logo />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xl text-[#F0FDF4] leading-tight">Meenamma</span>
                <span className="badge badge-emerald">Subscriber Referrals</span>
              </div>
              <span className="hidden sm:block text-[10px] font-mono text-[#5F8373] uppercase tracking-widest">100-Day Kudam Autopay Program</span>
            </div>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {currentUser ? (
              <>
                <nav className="flex items-center gap-0.5 p-1 rounded-lg border"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(16,185,129,0.12)' }}>
                  {[
                    ['dashboard', 'Subscribers & Rewards'],
                    ['leaderboard', 'Top Referrers'],
                    ['link', 'Invite Link'],
                  ].map(([id, label]) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className="px-3.5 py-1.5 rounded text-xs font-medium transition-all cursor-pointer"
                      style={{
                        background: activeTab === id ? '#10B981' : 'transparent',
                        color: activeTab === id ? '#030705' : '#A7C4B5',
                      }}>
                      {label}
                    </button>
                  ))}
                </nav>
                <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: 'rgba(16,185,129,0.12)' }}>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">{currentUser.name}</span>
                  <button onClick={handleSignOut} className="p-2 rounded-lg text-[#5F8373] hover:text-emerald-400 transition-colors cursor-pointer" title="Sign Out">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('login')} className="px-3 py-2 text-xs font-mono text-[#A7C4B5] hover:text-[#F0FDF4] transition-colors cursor-pointer uppercase tracking-wider">
                  Sign In
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                  onClick={() => setView('register')}
                  className="btn-emerald px-4 py-2 text-xs uppercase tracking-wider">
                  Become Referral Partner
                </motion.button>
              </div>
            )}
            <a href="https://meenamma.org" target="_blank" rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1 pl-3 border-l text-xs text-[#5F8373] hover:text-emerald-400 transition-colors font-mono"
              style={{ borderColor: 'rgba(16,185,129,0.12)' }}>
              meenamma.org <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 rounded-lg border cursor-pointer"
            style={{ borderColor: 'rgba(16,185,129,0.15)' }}
            onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t px-4 py-4 space-y-3"
              style={{ background: 'rgba(5,9,8,0.97)', borderColor: 'rgba(16,185,129,0.10)' }}>
              {currentUser ? (
                <>
                  <div className="text-xs font-mono text-[#5F8373]">Signed in as <strong className="text-emerald-400">{currentUser.name}</strong></div>
                  <div className="flex flex-col gap-2">
                    {[['dashboard', 'Subscribers & Rewards'], ['leaderboard', 'Top Referrers'], ['link', 'Invite Link']].map(([id, label]) => (
                      <button key={id} onClick={() => { setActiveTab(id); setMobileOpen(false); }}
                        className="py-2.5 px-3 rounded text-xs font-medium text-left cursor-pointer"
                        style={{ background: activeTab === id ? '#10B981' : 'rgba(255,255,255,0.05)', color: activeTab === id ? '#030705' : '#A7C4B5' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleSignOut} className="w-full py-2 rounded border text-xs font-mono text-rose-400 cursor-pointer"
                    style={{ borderColor: 'rgba(239,68,68,0.20)' }}>Sign Out</button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setView('login'); setMobileOpen(false); }}
                    className="py-3 rounded border text-xs font-mono text-center cursor-pointer"
                    style={{ borderColor: 'rgba(16,185,129,0.15)', color: '#F0FDF4' }}>Sign In</button>
                  <button onClick={() => { setView('register'); setMobileOpen(false); }}
                    className="btn-emerald py-3 rounded text-xs uppercase tracking-wider">Become Referral Partner</button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          LANDING PAGE — 100-Day Subscriber Program Explanation
          ============================================================ */}
      {view === 'landing' && !currentUser && (
        <main className="flex-1">
          {/* HERO */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 section-gap">
            <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-3xl">
              <motion.div variants={fadeUp}>
                <LiveBadge>100-Day Subscriber Milestone Rewards</LiveBadge>
              </motion.div>

              <motion.h1 variants={fadeUp}
                className="text-display mt-5 text-[clamp(2.5rem,5.5vw,4.2rem)] text-[#F0FDF4] leading-[1.08]">
                Get people to subscribe, not buy fish. Earn up to <span className="text-emerald-400">₹600</span> per 100-day completion.
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 text-base sm:text-lg text-[#A7C4B5] max-w-2xl leading-relaxed">
                Refer Chennai households to the <strong>100-Day Autopay Kudam Savings Plan</strong>. You don't get paid on fish sales — you get a guaranteed cash bounty when your referred subscriber completes their full 100-day savings cycle.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mt-8">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                  onClick={() => setView('register')}
                  className="btn-emerald px-8 py-4 text-sm uppercase tracking-wider flex items-center justify-center gap-2">
                  Start Referring Subscribers <ArrowRight className="w-4 h-4" />
                </motion.button>
                <button onClick={handleDemoLogin}
                  className="px-6 py-4 rounded-lg border text-sm font-mono text-emerald-400 cursor-pointer hover:bg-[rgba(16,185,129,0.06)] transition-colors flex items-center justify-center gap-2"
                  style={{ borderColor: 'rgba(16,185,129,0.22)' }}>
                  <Zap className="w-4 h-4" /> Live Partner Demo
                </button>
              </motion.div>
            </motion.div>
          </section>

          {/* 3 PLAN MILESTONE TIERS */}
          <section className="border-y section-gap" style={{ borderColor: 'rgba(16,185,129,0.08)', background: 'rgba(10,16,13,0.60)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-12">
                <h2 className="text-display text-3xl sm:text-4xl text-[#F0FDF4]">The 100-Day Payout Structure</h2>
                <p className="text-sm text-[#A7C4B5] mt-2 max-w-lg mx-auto">
                  Help the subscriber stay committed for 100 days. The moment day 100 settles, your payout unlocks automatically.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    plan: '₹1 / day Plan',
                    savings: '₹5,050 total subscriber savings',
                    payout: '₹200',
                    desc: 'For students and light savers beginning the daily habit.',
                    color: '#34D399',
                    badge: 'Starter Tier'
                  },
                  {
                    plan: '₹2 / day Plan',
                    savings: '₹10,100 total subscriber savings',
                    payout: '₹400',
                    desc: 'The most popular daily Kudam plan in Chennai neighborhoods.',
                    color: '#10B981',
                    badge: 'Most Popular'
                  },
                  {
                    plan: '₹5 / day Plan',
                    savings: '₹25,250 total subscriber savings',
                    payout: '₹600',
                    desc: 'For premium seafood feast savers looking for big festival hauls.',
                    color: '#F59E0B',
                    badge: 'Highest Payout'
                  },
                ].map((tier, idx) => (
                  <div key={idx} className="card-glass p-7 border relative overflow-hidden"
                    style={{ borderColor: 'rgba(16,185,129,0.20)' }}>
                    <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)', color: tier.color }}>
                      {tier.badge}
                    </span>
                    <h3 className="font-display text-2xl text-[#F0FDF4] mt-4">{tier.plan}</h3>
                    <div className="mt-4 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      <span className="text-xs font-mono text-[#5F8373] uppercase">Your Cash Reward</span>
                      <div className="text-4xl font-bold font-mono mt-1" style={{ color: tier.color }}>{tier.payout}</div>
                    </div>
                    <p className="text-xs text-[#A7C4B5] mt-4 leading-relaxed">{tier.desc}</p>
                    <div className="mt-4 text-[11px] font-mono text-[#5F8373]">
                      Subscriber accumulates: <strong className="text-[#F0FDF4]">{tier.savings}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ══════════════════════════════════════════════════════════════
          AUTHENTICATED PARTNER DASHBOARD (LIVE SYNC)
          ============================================================ */}
      {currentUser && (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Top Bar with Live Link */}
          <div className="card-glass p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono text-[#5F8373] uppercase tracking-wider">{currentUser.tier}</span>
              </div>
              <h1 className="text-display text-3xl text-[#F0FDF4]">{currentUser.name}</h1>
              <p className="text-xs text-[#5F8373] font-mono mt-1">
                Referral Code: <strong className="text-emerald-400 font-bold">{currentUser.referral_code}</strong> · Two-Way Cloud Synced
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-[#050908] p-2.5 rounded-lg border border-emerald-500/20 text-xs font-mono text-emerald-400">
                <span className="truncate max-w-[200px]">{referralLink}</span>
                <button onClick={() => copyLink(referralLink)} className="btn-emerald px-2.5 py-1 text-[11px] uppercase cursor-pointer">
                  {copied ? <Check className="w-3 h-3 inline" /> : <Copy className="w-3 h-3 inline" />}
                </button>
              </div>

              <button onClick={() => setShowAddSub(true)}
                className="btn-emerald px-4 py-2.5 text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                <UserPlus className="w-4 h-4" /> Add Subscriber
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="text-[10px] font-mono text-[#5F8373] uppercase tracking-wider mb-1">Active Subscribers</div>
              <div className="text-display text-3xl text-[#F0FDF4]">{activeSubs.length}</div>
              <div className="text-[11px] text-[#5F8373] mt-1">In 100-day cycle</div>
            </div>

            <div className="stat-card">
              <div className="text-[10px] font-mono text-[#5F8373] uppercase tracking-wider mb-1">Completed (100 Days)</div>
              <div className="text-display text-3xl text-emerald-400">{completedSubs.length}</div>
              <div className="text-[11px] text-[#5F8373] mt-1">100-day cycle finished</div>
            </div>

            <div className="stat-card">
              <div className="text-[10px] font-mono text-[#5F8373] uppercase tracking-wider mb-1">Locked Rewards</div>
              <div className="text-display text-3xl text-amber-400 font-mono">₹{lockedRewards}</div>
              <div className="text-[11px] text-[#5F8373] mt-1">Unlocks on Day 100</div>
            </div>

            <div className="stat-card border-emerald-500/30">
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">Ready for Payout</div>
              <div className="text-display text-3xl text-emerald-400 font-mono">₹{unlockedRewards}</div>
              <button
                disabled={unlockedRewards <= 0}
                onClick={() => setShowPayout(true)}
                className="mt-2 text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded bg-emerald-500 text-black font-bold disabled:opacity-30 cursor-pointer">
                Withdraw UPI
              </button>
            </div>
          </div>

          {/* Live Subscriber Roster */}
          <div className="card-glass p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-display text-2xl text-[#F0FDF4]">Your Subscriber Cohort</h2>
                <p className="text-xs text-[#A7C4B5] mt-0.5">
                  Subscribers must complete 100 continuous days of Autopay savings to release your cash reward.
                </p>
              </div>
              <button onClick={() => loadLiveSubscribers(currentUser.id, currentUser.referral_code)}
                className="text-xs font-mono text-[#5F8373] hover:text-emerald-400 p-2 cursor-pointer">
                ↻ Refresh Live
              </button>
            </div>

            {loadingSubs ? (
              <div className="py-12 text-center text-xs font-mono text-[#5F8373]">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                Syncing live subscriber progress...
              </div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl border-emerald-500/20">
                <Users className="w-8 h-8 text-[#5F8373] mx-auto mb-2" />
                <p className="text-sm text-[#F0FDF4] font-medium">No subscribers registered yet</p>
                <p className="text-xs text-[#A7C4B5] mt-1">Share your link or add your first subscriber above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subscribers.map((sub) => {
                  const progressPct = Math.min(100, Math.round((sub.cycleDay / 100) * 100));
                  return (
                    <div key={sub.id} className="p-4 rounded-xl border transition-all"
                      style={{
                        background: sub.isCompleted ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
                        borderColor: sub.isCompleted ? 'rgba(16,185,129,0.30)' : 'rgba(255,255,255,0.06)'
                      }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#F0FDF4]">{sub.name}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                              ₹{sub.plan}/day Plan
                            </span>
                            {sub.isCompleted && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500 text-black font-bold">
                                100 DAYS COMPLETE
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-[#5F8373] mt-1">
                            {sub.phone} · Started {sub.startDate}
                          </div>
                        </div>

                        <div className="text-right sm:shrink-0">
                          <div className="text-xs font-mono text-[#5F8373]">Milestone Reward</div>
                          <div className={`text-base font-bold font-mono ${sub.isCompleted ? 'text-emerald-400' : 'text-amber-400'}`}>
                            ₹{sub.rewardAmount} {sub.isCompleted ? '(UNLOCKED)' : '(LOCKED)'}
                          </div>
                        </div>
                      </div>

                      {/* Day progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="text-[#A7C4B5]">Progress: Day {sub.cycleDay} / 100</span>
                          <span className="text-emerald-400 font-bold">{progressPct}%</span>
                        </div>
                        <div className="w-full bg-[#050908] h-2 rounded-full overflow-hidden border border-emerald-500/10">
                          <div
                            className={`h-full transition-all duration-500 ${sub.isCompleted ? 'bg-emerald-400' : 'bg-emerald-500/70'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── ADD SUBSCRIBER MODAL (Two-Way Sync write) ── */}
      <AnimatePresence>
        {showAddSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card-glass w-full max-w-md p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-display text-xl text-[#F0FDF4]">Register New Subscriber</h3>
                <button onClick={() => setShowAddSub(false)} className="text-[#5F8373] hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-[#A7C4B5]">
                Enroll a customer into the 100-Day Autopay Savings Plan. Saves immediately to Supabase and syncs across apps.
              </p>

              <form onSubmit={handleCreateSubscriber} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-mono text-[#A7C4B5] mb-1">Subscriber Name</label>
                  <input type="text" required placeholder="e.g. Vignesh Kumar" value={newSubName} onChange={e => setNewSubName(e.target.value)} className="input-cyber" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A7C4B5] mb-1">Mobile Number (WhatsApp)</label>
                  <input type="tel" required placeholder="e.g. 98401 23456" value={newSubPhone} onChange={e => setNewSubPhone(e.target.value)} className="input-cyber" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A7C4B5] mb-1">Daily Savings Plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { plan: 1, reward: 200 },
                      { plan: 2, reward: 400 },
                      { plan: 5, reward: 600 },
                    ].map(item => (
                      <button key={item.plan} type="button" onClick={() => setNewSubPlan(item.plan)}
                        className={`p-3 rounded-lg border text-center transition-all cursor-pointer ${newSubPlan === item.plan ? 'border-emerald-400 bg-emerald-950/40 text-emerald-300' : 'border-white/10 text-white/70'}`}>
                        <div className="font-bold text-sm">₹{item.plan} / day</div>
                        <div className="text-[10px] font-mono text-emerald-400 mt-1">₹{item.reward} Bounty</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[11px] font-mono text-[#A7C4B5]">
                  Rule: Payout of <strong>₹{calculateMilestoneReward(newSubPlan)}</strong> will unlock when this subscriber completes all 100 days.
                </div>

                <button type="submit" disabled={addSubLoading} className="btn-emerald w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                  {addSubLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Sync Subscriber'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PAYOUT MODAL ── */}
      <AnimatePresence>
        {showPayout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card-glass w-full max-w-md p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-display text-xl text-[#F0FDF4]">Withdraw Unlocked Rewards</h3>
                <button onClick={() => setShowPayout(false)} className="text-[#5F8373] hover:text-white p-1 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#050908] border border-emerald-500/20">
                <div className="text-xs font-mono text-[#5F8373]">Eligible 100-Day Completion Balance</div>
                <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">₹{unlockedRewards}</div>
              </div>

              {payoutSuccess ? (
                <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center">
                  Payout request received! Disbursing to your UPI within 2 hours.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A7C4B5] mb-1">Your UPI ID</label>
                    <input type="text" placeholder="e.g. mobile@okhdfcbank" value={payoutUpi} onChange={e => setPayoutUpi(e.target.value)} className="input-cyber" />
                  </div>
                  <button onClick={handleRequestPayout} disabled={payoutLoading || !payoutUpi} className="btn-emerald w-full py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                    {payoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm UPI Transfer'}
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
              className="card-glass w-full max-w-md p-8 sm:p-10">
              <button onClick={() => setView('landing')} className="text-xs font-mono text-[#5F8373] hover:text-emerald-400 mb-6 flex items-center gap-1.5 cursor-pointer">
                ← Back
              </button>

              <h2 className="text-display text-3xl text-[#F0FDF4]">
                {view === 'login' ? 'Partner Login' : 'Referral Partner Registration'}
              </h2>
              <p className="text-xs text-[#A7C4B5] mt-1 mb-6">
                {view === 'login' ? 'Access your 100-day subscriber cohort and payouts.' : 'Sign up to start referring 100-day Autopay subscribers.'}
              </p>

              {authError && <div className="mb-4 p-3 rounded text-xs font-mono text-rose-300 bg-rose-950/30 border border-rose-500/20">{authError}</div>}
              {authSuccess && <div className="mb-4 p-3 rounded text-xs font-mono text-emerald-300 bg-emerald-950/30 border border-emerald-500/20">{authSuccess}</div>}

              {view === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="input-cyber" />
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="input-cyber" />
                  <button type="submit" disabled={authLoading} className="btn-emerald w-full py-3.5 text-xs uppercase tracking-wider">
                    {authLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                  <button type="button" onClick={handleDemoLogin} className="w-full py-3 rounded-lg border text-xs font-mono text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10 cursor-pointer">
                    ⚡ 1-Click Partner Demo
                  </button>
                  <p className="text-center text-xs text-[#5F8373] pt-2">
                    New partner?{' '}
                    <button type="button" onClick={() => setView('register')} className="text-emerald-400 hover:underline cursor-pointer">Register free</button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} required className="input-cyber" />
                  <input type="tel" placeholder="WhatsApp Phone" value={phone} onChange={e => setPhone(e.target.value)} required className="input-cyber" />
                  <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required className="input-cyber" />
                  <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="input-cyber" />
                  <button type="submit" disabled={authLoading} className="btn-emerald w-full py-3.5 text-xs uppercase tracking-wider">
                    {authLoading ? 'Registering...' : 'Create Account'}
                  </button>
                  <p className="text-center text-xs text-[#5F8373] pt-2">
                    Already registered?{' '}
                    <button type="button" onClick={() => setView('login')} className="text-emerald-400 hover:underline cursor-pointer">Sign in</button>
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
