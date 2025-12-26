import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://enndlirhxcdyhvbdgrhs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVubmRsaXJoeGNkeWh2YmRncmhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMTIyNTcsImV4cCI6MjA4MTU4ODI1N30.oce4FEs2YHuCxIZo1nzN-r8n40SUuEzCBwUmls1ynf0';

const customSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export default customSupabaseClient;

export { 
    customSupabaseClient,
    customSupabaseClient as supabase,
};
