const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlamZ1c3F5eHRtZWpid3BwZXhlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjU1ODczNywiZXhwIjoyMTAyMTM0NzM3fQ.JB1JpGkTiRblnc2EDoqpZTcWgASorF6XJeTYE2QrWLc';
const SUPABASE_URL = 'https://sejfusqyxtmejbwppexe.supabase.co';

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

export const TRACK_ROLES = {
  student: {
    id: 'student',
    title: 'Student Intern',
    stipend: 5000,
    period: 'Monthly Stipend',
    tagline: 'Work 10-12 hrs/week around college schedule. Fixed monthly pay + certificate.',
    badge: 'College Internship',
    defaultTasks: [
      { id: 't1', title: 'Host campus awareness booth for 100-Day savings', stipendCredit: 1250, week: 'Week 1', status: 'verified' },
      { id: 't2', title: 'Onboard 5 student hostel flats for weekend hauls', stipendCredit: 1250, week: 'Week 2', status: 'verified' },
      { id: 't3', title: 'Submit weekly campus dining feedback report', stipendCredit: 1250, week: 'Week 3', status: 'submitted' },
      { id: 't4', title: 'Conduct survey on Kasimedu seafood consumption', stipendCredit: 1250, week: 'Week 4', status: 'todo' },
    ]
  },
  housewife: {
    id: 'housewife',
    title: 'Housewife / Community Lead',
    stipend: 7000,
    period: 'Monthly Salary',
    tagline: 'Manage community seafood group in your apartment or neighborhood. Fixed salary.',
    badge: 'Community Leadership',
    defaultTasks: [
      { id: 't1', title: 'Organize residential group fresh catch order run', stipendCredit: 1750, week: 'Week 1', status: 'verified' },
      { id: 't2', title: 'Manage Saturday morning delivery distribution', stipendCredit: 1750, week: 'Week 2', status: 'verified' },
      { id: 't3', title: 'Enroll 4 apartment families into Daily Kudam savings', stipendCredit: 1750, week: 'Week 3', status: 'submitted' },
      { id: 't4', title: 'Weekly community hygiene & freshness audit', stipendCredit: 1750, week: 'Week 4', status: 'todo' },
    ]
  },
  outreach: {
    id: 'outreach',
    title: 'Digital & Local Outreach Fellow',
    stipend: 4500,
    period: 'Monthly Stipend',
    tagline: 'Digital storytelling, recipe features, and Kasimedu harbor dispatches.',
    badge: 'Creative Fellowship',
    defaultTasks: [
      { id: 't1', title: 'Document 3 harbor fishermen stories for social channels', stipendCredit: 1125, week: 'Week 1', status: 'verified' },
      { id: 't2', title: 'Publish morning catch report on WhatsApp status', stipendCredit: 1125, week: 'Week 2', status: 'verified' },
      { id: 't3', title: 'Host live Q&A on cleaning & cutting styles', stipendCredit: 1125, week: 'Week 3', status: 'todo' },
      { id: 't4', title: 'Monthly content performance breakdown', stipendCredit: 1125, week: 'Week 4', status: 'todo' },
    ]
  }
};

/**
 * Fetch Earn Membership for user (Two-way synced with Supabase content_entries)
 */
export async function fetchEarnMembership(userId) {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_entries?content_type=eq.earn_membership&created_by=eq.${userId}&limit=1`,
      { headers }
    );
    if (!res.ok) throw new Error('Fetch failed');
    const rows = await res.json();
    if (rows && rows.length > 0) {
      const b = rows[0].body || {};
      return {
        id: rows[0].id,
        trackId: b.track_id || 'student',
        trackTitle: b.track_title || 'Student Intern',
        monthlySalary: Number(b.monthly_salary || 5000),
        organization: b.organization || 'Anna University',
        joinedDate: b.joined_date || rows[0].created_at?.substring(0, 10),
        status: b.status || 'Active',
        upiId: b.upi_id || 'member@upi',
        totalPaid: Number(b.total_paid || 5000),
        currentAccrued: Number(b.current_accrued || 2500),
        tasks: b.tasks || TRACK_ROLES[b.track_id || 'student'].defaultTasks
      };
    }
  } catch (_) {}

  // Default seed for demo or new members
  return {
    id: 'mem_demo',
    trackId: 'student',
    trackTitle: 'Student Intern',
    monthlySalary: 5000,
    organization: 'Anna University, Chennai',
    joinedDate: '2026-08-01',
    status: 'Active',
    upiId: 'rathna@okhdfcbank',
    totalPaid: 5000,
    currentAccrued: 2500,
    tasks: TRACK_ROLES.student.defaultTasks
  };
}

/**
 * Register or update an Earn Member in Supabase
 */
export async function saveEarnMembership({ userId, name, email, phone, trackId, organization, upiId }) {
  const role = TRACK_ROLES[trackId] || TRACK_ROLES.student;
  const nowStr = new Date().toISOString().substring(0, 10);

  const payload = {
    content_type: 'earn_membership',
    slug: `earn_${userId?.substring(0, 8) || 'user'}`,
    locale: 'en',
    status: 'published',
    title: `Earn Member - ${name}`,
    created_by: userId || '338b3361-779c-474e-83d0-ff95a4b55901',
    body: {
      user_id: userId,
      name,
      email,
      phone,
      track_id: trackId,
      track_title: role.title,
      monthly_salary: role.stipend,
      organization,
      upi_id: upiId || 'member@upi',
      joined_date: nowStr,
      status: 'Active',
      total_paid: 0,
      current_accrued: Math.round(role.stipend / 2),
      tasks: role.defaultTasks
    }
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/content_entries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  return res.ok;
}

/**
 * Submit task verification proof
 */
export async function submitTaskVerification({ membershipId, userId, taskId, proofText }) {
  try {
    // Record task submission event
    const payload = {
      content_type: 'earn_task_submission',
      slug: `sub_${taskId}_${Date.now()}`,
      locale: 'en',
      status: 'published',
      title: `Task Submission ${taskId}`,
      created_by: userId || '338b3361-779c-474e-83d0-ff95a4b55901',
      body: {
        membership_id: membershipId,
        task_id: taskId,
        proof: proofText,
        submitted_at: new Date().toISOString(),
        status: 'submitted'
      }
    };
    await fetch(`${SUPABASE_URL}/rest/v1/content_entries`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Request Salary / Stipend Disbursement via UPI
 */
export async function requestSalaryDisbursement({ userId, amountInr, upiId, trackTitle }) {
  const payload = {
    content_type: 'salary_disbursement',
    slug: `sal_${userId?.substring(0, 8)}_${Date.now()}`,
    locale: 'en',
    status: 'published',
    title: `Salary Disbursement ₹${amountInr} - ${trackTitle}`,
    created_by: userId || '338b3361-779c-474e-83d0-ff95a4b55901',
    body: {
      user_id: userId,
      amount_inr: Number(amountInr),
      upi_id: upiId,
      track: trackTitle,
      status: 'processing',
      requested_at: new Date().toISOString()
    }
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/content_entries`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  return res.ok;
}
