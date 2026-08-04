import { BellOff, BellRing } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ACCESS_LEVEL, AUTONOMY_LEVEL, VALIDATION_THRESHOLD } from "@/lib/agents/meta";
import type { AgentConfig, AgentTool } from "@/lib/agents/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-[14px] font-medium text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="border-border bg-surface p-4">
      <p className="truncate text-[12px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-[14px] text-foreground">{children}</div>
    </Card>
  );
}

/** Onglet « Configuration » — lecture seule. */
export function AgentConfigTab({ config, tools }: { config: AgentConfig; tools: AgentTool[] }) {
  const NotifIcon = config.notificationsEnabled ? BellRing : BellOff;

  return (
    <div className="space-y-6">
      <Section title="Général">
        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
            <Field label="Langue">{config.language}</Field>
            <Field label="Fuseau horaire">{config.timezone}</Field>
          </div>
        </div>
      </Section>

      <Section title="Autonomie">
        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
            <Field label="Niveau d'autonomie">
              <Badge variant={AUTONOMY_LEVEL[config.autonomyLevel].variant}>
                {AUTONOMY_LEVEL[config.autonomyLevel].label}
              </Badge>
            </Field>
            <Field label="Fréquence d'exécution">{config.executionFrequency}</Field>
          </div>
        </div>
      </Section>

      <Section title="Validation">
        <Field label="Seuil de validation humaine">
          <Badge variant={VALIDATION_THRESHOLD[config.validationThreshold].variant}>
            {VALIDATION_THRESHOLD[config.validationThreshold].label}
          </Badge>
        </Field>
      </Section>

      <Section title="Notifications">
        <Field label="État">
          <span className="flex items-center gap-2">
            <NotifIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <Badge variant={config.notificationsEnabled ? "success" : "neutral"}>
              {config.notificationsEnabled ? "Activées" : "Désactivées"}
            </Badge>
          </span>
        </Field>
      </Section>

      <Section title="Outils actifs">
        <div className="@container">
          <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-3">
            {tools.map((tool) => {
              const enabled = config.enabledTools.includes(tool.id);
              const access = ACCESS_LEVEL[tool.accessLevel];
              return (
                <div
                  key={tool.id}
                  className="space-y-2 rounded-lg border border-border bg-surface p-4"
                >
                  <p className="truncate text-[14px] font-medium text-foreground">{tool.name}</p>
                  <div className="flex flex-wrap gap-1">
                    <Badge>{tool.category}</Badge>
                    <Badge variant={access.variant}>{access.label}</Badge>
                    <Badge variant={enabled ? "success" : "neutral"}>
                      {enabled ? "Activé" : "Désactivé"}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Section>

      <Section title="Limites d'usage">
        <div className="@container">
          <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-3">
            {config.usageLimits.map((limit) => (
              <Card key={limit.label} className="border-border bg-surface p-4">
                <p className="truncate text-[12px] uppercase tracking-wide text-muted-foreground">
                  {limit.label}
                </p>
                <p className="mt-1 text-[20px] font-medium tabular-nums text-foreground">
                  {limit.value}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <p className="text-[12px] text-muted-foreground">
        Lecture seule — l'édition arrivera dans une prochaine itération.
      </p>
    </div>
  );
}
