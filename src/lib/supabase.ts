import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bxivnkwwajcpaulimemp.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1XbNDb1eRkdSAO04R9QA6g_l1vNNrCh';

export const supabase = createClient(supabaseUrl, supabaseKey);
