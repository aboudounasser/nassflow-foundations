/**
 * Types partagés issus du premier Dashboard CEO : l'état des widgets
 * (`WidgetShell`), la priorité et le modèle de mission dont `MissionDetail`
 * hérite.
 */

export type WidgetState = "loading" | "empty" | "error" | "success";

export type Priority = "low" | "medium" | "high" | "critical";

export interface Mission {
  id: string;
  title: string;
  priority: Priority;
  status: "todo" | "running" | "blocked" | "done";
  progress: number;
  dueDate: string;
  owner: string;
  agents: { id: string; name: string; avatar: string }[];
  tags: string[];
}
