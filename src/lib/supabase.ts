import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nyckbuzwnaakphtvxwxh.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Y2tidXp3bmFha3BodHZ4d3hoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMDQzMjYsImV4cCI6MjEwODU4MDMyNn0.Fn303zagM1-9b9L2iOOfBDPgn1DTZwrvR1xUJ6WcsPE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
