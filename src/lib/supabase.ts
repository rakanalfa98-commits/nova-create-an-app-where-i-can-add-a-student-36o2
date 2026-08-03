import { createClient } from "@supabase/supabase-js";

// Public Supabase credentials for this project, provisioned by Nova.
export const supabaseUrl = "https://spprykvxafiopyzfozti.supabase.co";
export const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwcHJ5a3Z4YWZpb3B5emZvenRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDYzNTQsImV4cCI6MjEwMTMyMjM1NH0.5L3ECCNsfdXIebVypFzF5sroguNmIAx4tXcsTs9HJ6U";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
