import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const SUPABASE_URL = 'https://wytxiathqtwnunudabiu.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dHhpYXRocXR3bnVudWRhYml1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjE3MDEsImV4cCI6MjA3NjczNzcwMX0.PKFi0YDdpuI16u8-fh_ef2RCP50Q4Lxzcq85Hmp-K0I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);