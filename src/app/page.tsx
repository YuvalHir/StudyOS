import { createClient } from "@/utils/supabase/server";
import AppClient from "./AppClient";
import Login from "@/components/Auth/Login";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <Login />;
  }

  const { data: { session } } = await supabase.auth.getSession();

  return <AppClient session={session} />;
}
