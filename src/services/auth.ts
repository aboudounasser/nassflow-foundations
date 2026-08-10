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

async function selectProfile(userId: string) {
  return await supabase
    .from("profiles")
    .select("full_name, job_title")
    .eq("id", userId)
    .maybeSingle();
}

async function selectMemberships() {
  return await supabase.from("memberships").select("role, organizations(id, name)");
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;

  const { data: profile, error: profileError } = await selectProfile(user.id);
  if (profileError) throw new Error(profileError.message);

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    jobTitle: profile?.job_title ?? null,
  };
}

export async function getMemberships(): Promise<MembershipEntry[]> {
  const { data, error } = await selectMemberships();
  if (error) throw new Error(error.message);

  const entries: MembershipEntry[] = [];
  for (const row of data ?? []) {
    if (!row.organizations) continue;
    entries.push({
      organization: { id: row.organizations.id, name: row.organizations.name },
      role: row.role,
    });
  }
  return entries.sort((a, b) => a.organization.name.localeCompare(b.organization.name, "fr"));
}

function originUrl(path = ""): string {
  return typeof window === "undefined" ? "" : `${window.location.origin}${path}`;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signUp(email: string, password: string, fullName: string): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: originUrl() },
  });
  if (error) throw new Error(error.message);
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: originUrl("/reset-password"),
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Session expirée. Reconnectez-vous.");
  return data.user.id;
}

export async function updateProfile(input: {
  fullName: string;
  jobTitle: string;
}): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.fullName.trim() || null,
      job_title: input.jobTitle.trim() || null,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function updateOrganizationDetails(
  organizationId: string,
  input: { industry: string; size: string },
): Promise<void> {
  const { error } = await supabase
    .from("organizations")
    .update({
      industry: input.industry.trim() || null,
      size: input.size.trim() || null,
    })
    .eq("id", organizationId);
  if (error) throw new Error(error.message);
}

/** Le trigger base refuse le départ du dernier propriétaire : message propagé tel quel. */
export async function leaveOrganization(organizationId: string): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("organization_id", organizationId)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
}

export async function createOrganization(name: string): Promise<{ id: string; name: string }> {
  const { data, error } = await supabase.rpc("create_organization", { org_name: name });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Création de l'organisation impossible.");
  return { id: data.id, name: data.name };
}

export function onAuthChange(cb: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(() => {
    cb();
  });
  return () => {
    data.subscription.unsubscribe();
  };
}
