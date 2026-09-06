import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://sejfusqyxtmejbwppexe.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlamZ1c3F5eHRtZWpid3BwZXhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NTg3MzcsImV4cCI6MjEwMjEzNDczN30.3xQOWceFzO0AbJiBXzUH5ShX6-iDEhQ7s1UVu8L6wGA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
