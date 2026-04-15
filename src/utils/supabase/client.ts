import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a single instance to be shared across all client components
export const supabase = createBrowserClient(
  supabaseUrl!,
  supabaseKey!,
);

// Backward compatibility helper
export const createClient = () => supabase;
