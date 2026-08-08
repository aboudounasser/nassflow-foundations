/** Déclaration de types du schéma Supabase existant. Aucun effet runtime. */

export type MemberRoleDb = "owner" | "admin" | "manager" | "member" | "viewer";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: { id: string; name: string; created_at: string };
        Insert: never;
        Update: { name?: string };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          job_title: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: never;
        Update: {
          full_name?: string | null;
          job_title?: string | null;
          avatar_url?: string | null;
        };
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          role: MemberRoleDb;
          created_at: string;
        };
        Insert: { user_id: string; organization_id: string; role?: MemberRoleDb };
        Update: { role?: MemberRoleDb };
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization: {
        Args: { org_name: string };
        Returns: { id: string; name: string; created_at: string };
      };
    };
    Enums: { member_role: MemberRoleDb };
    CompositeTypes: Record<string, never>;
  };
}
