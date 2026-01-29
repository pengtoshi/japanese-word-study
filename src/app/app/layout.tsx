import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/layouts/common/AppShell";
import { DEFAULT_JLPT_LEVEL, type JlptLevel } from "@/lib/jlpt";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  let jlptLevel: JlptLevel | null = DEFAULT_JLPT_LEVEL;
  try {
    const { data: settings, error } = await supabase
      .from("user_settings")
      .select("jlpt_level")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!error && settings?.jlpt_level) {
      jlptLevel = settings.jlpt_level as JlptLevel;
    }
  } catch {
    // If the table doesn't exist yet (schema not applied), fall back to default.
  }

  return (
    <AppShell email={data.user.email} jlptLevel={jlptLevel}>
      {children}
    </AppShell>
  );
}
