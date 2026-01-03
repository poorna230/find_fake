import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ppzysxdqxipbtnxgwtjc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwenlzeGRxeGlwYnRueGd3dGpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4Nzg3MjAsImV4cCI6MjA1MTQ1NDcyMH0.7Eqnr9p4J7zF1fZz4fF8C_Ey3PvhBKDDR3FNu3VeBNg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
