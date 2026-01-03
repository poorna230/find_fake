import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://esvqdrgvlhzbeglsegbu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnFkcmd2bGh6YmVnbHNlZ2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NDQ0NjEsImV4cCI6MjA4MzAyMDQ2MX0.mwRUg1AT96nzrqasd5rUaUf7iJa4VHViURxkbX0u564";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
