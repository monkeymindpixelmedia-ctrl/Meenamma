-- M13: UPI autopay mandate fields + deposit source tagging
alter table public.profiles
  add column if not exists autopay_subscription_id text,
  add column if not exists autopay_status text not null default 'none'
    check (autopay_status in ('none', 'pending', 'active', 'paused', 'cancelled'));

alter table public.kudam_deposits
  add column if not exists source text not null default 'razorpay'
    check (source in ('razorpay', 'autopay', 'simulated'));
