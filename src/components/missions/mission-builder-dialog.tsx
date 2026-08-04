import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarClock,
  Check,
  LayoutTemplate,
  Plus,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { PRIORITY_BADGE } from "@/components/dashboard/decision-item-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDueDate } from "@/lib/missions/meta";
import { missionBlueprints } from "@/lib/missions/mocks";
import type {
  MissionAgent,
  MissionBlueprint,
  MissionDraft,
  MissionStepDraft,
  TriggerType,
} from "@/lib/missions/types";
import type { Priority } from "@/lib/dashboard/types";

const STEPS = [
  "Point de départ",
  "Objectif",
  "Agents & Outils",
  "Étapes & Validation",
  "Révision",
] as const;

const PRIORITIES: Priority[] = ["low", "medium", "high", "critical"];

const TRIGGER_LABEL: Record<TriggerType, string> = {
  manual: "Manuel",
  scheduled: "Planifié",
  event: "Événementiel",
};

const VALIDATION_LABEL: Record<MissionDraft["validationThreshold"], string> = {
  none: "Aucune validation requise",
  critical_only: "Validation sur étapes critiques uniquement",
  all_steps: "Validation à chaque étape",
};

const EMPTY_DRAFT: MissionDraft = {
  title: "",
  objective: "",
  priority: "medium",
  tags: [],
  dueDate: null,
  agentIds: [],
  steps: [],
  triggerType: "manual",
  scheduledFor: null,
  eventDescription: "",
  validationThreshold: "none",
};

let stepSeq = 0;
const newStep = (partial?: Partial<MissionStepDraft>): MissionStepDraft => ({
  id: `draft-step-${++stepSeq}`,
  title: "",
  agentId: null,
  requiresValidation: false,
  ...partial,
});

function isDirty(draft: MissionDraft) {
  return (
    draft.title.trim() !== "" ||
    draft.objective.trim() !== "" ||
    draft.tags.length > 0 ||
    draft.agentIds.length > 0 ||
    draft.steps.length > 0 ||
    draft.dueDate !== null
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <>
      {/* Mobile : compteur + barre de progression */}
      <div className="space-y-2 sm:hidden">
        <div className="flex items-center justify-between text-[12px] text-muted-foreground">
          <span>
            Étape {current + 1}/{STEPS.length}
          </span>
          <span className="text-foreground">{STEPS[current]}</span>
        </div>
        <Progress value={((current + 1) / STEPS.length) * 100} className="h-1.5" />
      </div>

      {/* Desktop : stepper horizontal complet */}
      <ol className="hidden items-center gap-2 sm:flex">
        {STEPS.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium",
                  done && "border-success/30 bg-success/15 text-success",
                  active && "border-primary bg-primary/15 text-primary",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {done ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-[12px]",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {index < STEPS.length - 1 ? (
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </section>
  );
}

/** Assistant multi-étapes de création de mission — visuel uniquement, aucune persistance. */
export function MissionBuilderDialog({
  open,
  onOpenChange,
  agents,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agents: MissionAgent[];
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<MissionDraft>(EMPTY_DRAFT);
  const [mode, setMode] = useState<"scratch" | "template" | null>(null);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  const patch = (values: Partial<MissionDraft>) => setDraft((d) => ({ ...d, ...values }));

  const selectedAgents = useMemo(
    () => agents.filter((a) => draft.agentIds.includes(a.id)),
    [agents, draft.agentIds],
  );

  const reset = () => {
    setStep(0);
    setDraft(EMPTY_DRAFT);
    setMode(null);
    setBlueprintId(null);
    setTagInput("");
    setConfirmClose(false);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const requestClose = () => {
    if (isDirty(draft) || mode !== null) setConfirmClose(true);
    else close();
  };

  const applyBlueprint = (bp: MissionBlueprint) => {
    setBlueprintId(bp.id);
    patch({
      title: bp.title,
      objective: bp.description,
      agentIds: bp.defaultAgentIds,
      steps: bp.defaultSteps.map((s) => newStep({ title: s.title, agentId: s.agentId })),
      tags: [bp.category],
    });
  };

  const stepValid = (() => {
    if (step === 0) return mode === "scratch" || (mode === "template" && blueprintId !== null);
    if (step === 1) return draft.title.trim() !== "" && draft.objective.trim() !== "";
    if (step === 2) return draft.agentIds.length > 0;
    if (step === 3)
      return (
        draft.steps.length > 0 &&
        draft.steps.every((s) => s.title.trim() !== "") &&
        (draft.triggerType !== "scheduled" || !!draft.scheduledFor)
      );
    return true;
  })();

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || draft.tags.includes(value)) return;
    patch({ tags: [...draft.tags, value] });
    setTagInput("");
  };

  const updateStep = (id: string, values: Partial<MissionStepDraft>) =>
    patch({ steps: draft.steps.map((s) => (s.id === id ? { ...s, ...values } : s)) });

  const moveStep = (index: number, delta: number) => {
    const next = [...draft.steps];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    patch({ steps: next });
  };

  const finish = (message: string) => {
    toast.success(message);
    close();
  };

  const agentName = (id: string | null) =>
    agents.find((a) => a.id === id)?.name ?? "Non assigné";

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <DialogContent className="flex max-h-svh h-svh w-full max-w-none flex-col gap-4 overflow-hidden rounded-none sm:h-auto sm:max-h-[90svh] sm:max-w-[680px] sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>Mission Builder</DialogTitle>
          <DialogDescription>
            Composez une mission : objectif, agents, outils, déclenchement et validations.
          </DialogDescription>
        </DialogHeader>

        <Stepper current={step} />
        <Separator />

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          {step === 0 ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { id: "scratch", label: "Partir de zéro", icon: Sparkles, hint: "Mission vierge, tout à définir" },
                    { id: "template", label: "Utiliser un modèle", icon: LayoutTemplate, hint: "Pré-remplir depuis un blueprint" },
                  ] as const
                ).map((option) => {
                  const Icon = option.icon;
                  const active = mode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setMode(option.id);
                        if (option.id === "scratch") setBlueprintId(null);
                      }}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface hover:bg-card",
                      )}
                    >
                      <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="text-[14px] text-foreground">{option.label}</span>
                      <span className="text-[12px] text-muted-foreground">{option.hint}</span>
                    </button>
                  );
                })}
              </div>

              {mode === "template" ? (
                <FieldGroup title="Modèles disponibles">
                  <ul className="space-y-2">
                    {missionBlueprints.map((bp) => {
                      const active = blueprintId === bp.id;
                      return (
                        <li key={bp.id}>
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={() => applyBlueprint(bp)}
                            className={cn(
                              "w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "border-primary bg-primary/10"
                                : "border-border bg-surface hover:bg-card",
                            )}
                          >
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-[14px] text-foreground">{bp.title}</span>
                              <Badge variant={active ? "primary" : "neutral"}>{bp.category}</Badge>
                            </span>
                            <span className="mt-1 block text-[12px] leading-5 text-muted-foreground">
                              {bp.description}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </FieldGroup>
              ) : null}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mb-title">Titre</Label>
                <Input
                  id="mb-title"
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder="Ex : Relancer les prospects inactifs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mb-objective">Objectif</Label>
                <Textarea
                  id="mb-objective"
                  rows={4}
                  value={draft.objective}
                  onChange={(e) => patch({ objective: e.target.value })}
                  placeholder="Décrivez le résultat métier attendu, les contraintes et les critères de succès…"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Priorité</Label>
                  <Select
                    value={draft.priority}
                    onValueChange={(v) => patch({ priority: v as Priority })}
                  >
                    <SelectTrigger aria-label="Priorité de la mission">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_BADGE[p].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mb-due">Échéance</Label>
                  <Input
                    id="mb-due"
                    type="date"
                    value={draft.dueDate ?? ""}
                    onChange={(e) => patch({ dueDate: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mb-tags">Tags</Label>
                <Input
                  id="mb-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Saisissez un tag puis Entrée"
                />
                {draft.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {draft.tags.map((tag) => (
                      <Badge key={tag} variant="primary">
                        {tag}
                        <button
                          type="button"
                          aria-label={`Retirer le tag ${tag}`}
                          onClick={() => patch({ tags: draft.tags.filter((t) => t !== tag) })}
                          className="ml-0.5 cursor-pointer opacity-70 hover:opacity-100"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <ul className="space-y-2">
              {agents.map((agent) => {
                const active = draft.agentIds.includes(agent.id);
                return (
                  <li key={agent.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        patch({
                          agentIds: active
                            ? draft.agentIds.filter((id) => id !== agent.id)
                            : [...draft.agentIds, agent.id],
                          steps: active
                            ? draft.steps.map((s) =>
                                s.agentId === agent.id ? { ...s, agentId: null } : s,
                              )
                            : draft.steps,
                        })
                      }
                      className={cn(
                        "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "border-primary bg-primary/10" : "border-border bg-surface hover:bg-card",
                      )}
                    >
                      <Avatar className="size-9">
                        <AvatarFallback className="text-[10px]">{agent.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] text-foreground">{agent.name}</span>
                        <span className="block text-[12px] text-muted-foreground">{agent.role}</span>
                        {agent.tools?.length ? (
                          <span className="mt-2 flex flex-wrap gap-1">
                            {agent.tools.map((tool) => (
                              <Badge key={tool}>{tool}</Badge>
                            ))}
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "mt-1 flex size-5 shrink-0 items-center justify-center rounded-md border",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                        )}
                        aria-hidden="true"
                      >
                        {active ? <Check className="size-3.5" /> : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {step === 3 ? (
            <div className="space-y-6">
              <FieldGroup title="Étapes d'exécution">
                <ul className="space-y-2">
                  {draft.steps.map((s, index) => (
                    <li key={s.id} className="space-y-3 rounded-xl border border-border bg-surface p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] tabular-nums text-muted-foreground">
                          {index + 1}.
                        </span>
                        <Input
                          value={s.title}
                          onChange={(e) => updateStep(s.id, { title: e.target.value })}
                          placeholder="Intitulé de l'étape"
                          aria-label={`Titre de l'étape ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Monter l'étape"
                          disabled={index === 0}
                          onClick={() => moveStep(index, -1)}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Descendre l'étape"
                          disabled={index === draft.steps.length - 1}
                          onClick={() => moveStep(index, 1)}
                        >
                          <ArrowDown />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Supprimer l'étape"
                          onClick={() => patch({ steps: draft.steps.filter((x) => x.id !== s.id) })}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Select
                          value={s.agentId ?? ""}
                          onValueChange={(v) => updateStep(s.id, { agentId: v })}
                        >
                          <SelectTrigger
                            className="w-[220px]"
                            aria-label={`Agent de l'étape ${index + 1}`}
                          >
                            <SelectValue placeholder="Assigner un agent" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedAgents.map((a) => (
                              <SelectItem key={a.id} value={a.id}>
                                {a.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                          <Switch
                            checked={s.requiresValidation}
                            onCheckedChange={(checked) =>
                              updateStep(s.id, { requiresValidation: checked })
                            }
                          />
                          Nécessite une validation humaine
                        </label>
                      </div>
                    </li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => patch({ steps: [...draft.steps, newStep()] })}
                >
                  <Plus />
                  Ajouter une étape
                </Button>
              </FieldGroup>

              <FieldGroup title="Déclenchement">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Select
                    value={draft.triggerType}
                    onValueChange={(v) => patch({ triggerType: v as TriggerType })}
                  >
                    <SelectTrigger aria-label="Type de déclenchement">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(TRIGGER_LABEL) as TriggerType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {TRIGGER_LABEL[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {draft.triggerType === "scheduled" ? (
                    <Input
                      type="datetime-local"
                      aria-label="Date et heure de planification"
                      value={draft.scheduledFor ?? ""}
                      onChange={(e) => patch({ scheduledFor: e.target.value || null })}
                    />
                  ) : null}

                  {draft.triggerType === "event" ? (
                    <Input
                      aria-label="Condition de déclenchement"
                      value={draft.eventDescription}
                      onChange={(e) => patch({ eventDescription: e.target.value })}
                      placeholder="Se déclenche quand…"
                    />
                  ) : null}
                </div>
              </FieldGroup>

              <FieldGroup title="Règles de validation globales">
                <Select
                  value={draft.validationThreshold}
                  onValueChange={(v) =>
                    patch({ validationThreshold: v as MissionDraft["validationThreshold"] })
                  }
                >
                  <SelectTrigger aria-label="Règle de validation globale">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(VALIDATION_LABEL) as MissionDraft["validationThreshold"][]
                    ).map((v) => (
                      <SelectItem key={v} value={v}>
                        {VALIDATION_LABEL[v]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-[16px] font-medium text-foreground">{draft.title}</h3>
                <div className="flex flex-wrap gap-1">
                  <Badge variant={PRIORITY_BADGE[draft.priority].variant}>
                    {PRIORITY_BADGE[draft.priority].label}
                  </Badge>
                  {draft.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>

              <p className="text-[14px] leading-6 text-muted-foreground">{draft.objective}</p>

              <Separator />

              <FieldGroup title="Agents mobilisés">
                <ul className="space-y-2">
                  {selectedAgents.map((agent) => (
                    <li key={agent.id} className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-[10px]">{agent.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] text-foreground">
                          {agent.name}
                        </span>
                        <span className="block truncate text-[12px] text-muted-foreground">
                          {agent.tools?.join(" · ") ?? agent.role}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </FieldGroup>

              <FieldGroup title="Étapes">
                <ol className="space-y-2">
                  {draft.steps.map((s, index) => (
                    <li key={s.id} className="flex items-start gap-2 text-[14px] text-foreground">
                      <span className="mt-0.5 text-[12px] tabular-nums text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block">{s.title}</span>
                        <span className="block text-[12px] text-muted-foreground">
                          {agentName(s.agentId)}
                          {s.requiresValidation ? " · validation humaine" : ""}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </FieldGroup>

              <FieldGroup title="Déclenchement & validation">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="info">
                    {draft.triggerType === "scheduled" ? <CalendarClock /> : <Zap />}
                    {TRIGGER_LABEL[draft.triggerType]}
                    {draft.triggerType === "scheduled" && draft.scheduledFor
                      ? ` · ${draft.scheduledFor.replace("T", " ")}`
                      : ""}
                  </Badge>
                  {draft.triggerType === "event" && draft.eventDescription ? (
                    <Badge>{draft.eventDescription}</Badge>
                  ) : null}
                  <Badge>{VALIDATION_LABEL[draft.validationThreshold]}</Badge>
                  {draft.dueDate ? <Badge>Échéance : {formatDueDate(draft.dueDate)}</Badge> : null}
                </div>
              </FieldGroup>
            </div>
          ) : null}
        </div>

        <Separator />

        {confirmClose ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-muted-foreground">
              Abandonner la mission en cours de création ?
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setConfirmClose(false)}>
                Continuer
              </Button>
              <Button variant="destructive" onClick={close}>
                Abandonner
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Précédent
            </Button>

            {step < STEPS.length - 1 ? (
              <Button
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={!stepValid}
              >
                Suivant
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => finish("Mission enregistrée en brouillon (mock)")}
                >
                  Enregistrer comme brouillon
                </Button>
                <Button onClick={() => finish("Mission créée et lancée (mock)")}>
                  Créer et lancer
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
