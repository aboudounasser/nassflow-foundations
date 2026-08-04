import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MissionAgent } from "@/lib/missions/types";

/** Formulaire visuel uniquement — aucune logique métier ni persistance. */
export function CreateMissionDialog({
  open,
  onOpenChange,
  agents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: MissionAgent[];
}) {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Créer une Mission</DialogTitle>
          <DialogDescription>
            Définissez l'objectif métier et les agents mobilisés.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Mission créée (mock)");
            setSelected([]);
            onOpenChange(false);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="mission-title">Titre</Label>
            <Input id="mission-title" placeholder="Ex : Relancer les prospects inactifs" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mission-objective">Objectif</Label>
            <Textarea
              id="mission-objective"
              rows={4}
              placeholder="Décrivez l'objectif métier attendu…"
            />
          </div>
          <div className="space-y-2">
            <Label>Agents à assigner</Label>
            <div className="flex flex-wrap gap-2">
              {agents.map((agent) => {
                const active = selected.includes(agent.id);
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() =>
                      setSelected((prev) =>
                        prev.includes(agent.id)
                          ? prev.filter((id) => id !== agent.id)
                          : [...prev, agent.id],
                      )
                    }
                    className={cn(
                      "rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    )}
                    aria-pressed={active}
                  >
                    <Badge variant={active ? "primary" : "neutral"}>{agent.name}</Badge>
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer la mission</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}