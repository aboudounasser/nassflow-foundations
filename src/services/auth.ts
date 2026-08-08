import { supabase } from "@/lib/supabase/client";
import type { MemberRoleDb } from "@/lib/supabase/database.types";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  jobTitle: string | null;
}

export interface MembershipEntry {
  organization: { id: string; name: string };
  role: MemberRoleDb;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, job_title")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    jobTitle: profile?.job_title ?? null,
  };
}

export async function getMemberships(): Promise<MembershipEntry[]> {
  const { data, error } = await supabase.from("memberships").select("role, organizations(id, name)");
  if (error) throw new Error(error.message);

  const entries: MembershipEntry[] = [];
  for (const row of data ?? []) {
    const org = row.organizations as unknown as { id: string; name: string } | null;
    if (!org) continue;
    entries.push({ organization: { id: org.id, name: org.name }, role: row.role });
  }
  return entries.sort((a, b) => a.organization.name.localeCompare(b.organization.name, "fr"));
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signUp(email: string, password: string, fullName: string): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
  });
  if (error) throw new Error(error.message);
}

export async function createOrganization(name: string): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase.rpc("create_organization", { org_name: name });
  if (error) throw new Error(error.message);
  const org = data as unknown as { id: string; name: string };
  return { id: org.id, name: org.name };
}

export function onAuthChange(cb: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(() => {
    cb();
  });
  return () => {
    data.subscription.unsubscribe();
  };
}