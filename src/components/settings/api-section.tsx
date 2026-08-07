import { Copy, KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SettingsCard } from "@/components/settings/settings-rows";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSettingsDate } from "@/lib/settings/meta";
import type { ApiKey } from "@/lib/settings/types";

export function ApiSection({ apiKeys }: { apiKeys: ApiKey[] }) {
  const [target, setTarget] = useState<ApiKey | null>(null);

  return (
    <>
      <SettingsCard
        title="Clés API"
        action={
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => toast("Nouvelle clé API générée (mock)")}
          >
            <Plus aria-hidden="true" />
            Générer une nouvelle clé
          </Button>
        }
      >
        <p className="text-[12px] leading-4 text-muted-foreground">
          Les clés ne sont jamais affichées en clair : seule une version masquée est conservée.
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          {apiKeys.map((key) => {
            const revoked = key.status === "revoked";
            return (
              <li key={key.id} className="rounded-lg border border-border bg-surface p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <KeyRound
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="truncate text-[14px] text-foreground">{key.label}</span>
                  </div>
                  <Badge variant={revoked ? "neutral" : "success"}>
                    {revoked ? "Révoquée" : "Active"}
                  </Badge>
                </div>

                <p className="mt-2 font-mono text-[12px] text-muted-foreground">{key.maskedKey}</p>

                <div className="mt-2 flex flex-wrap gap-1">
                  {key.scopes.map((scope) => (
                    <Badge key={scope} variant="info">
                      {scope}
                    </Badge>
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
                  <span>Créée le {formatSettingsDate(key.createdAt)}</span>
                  <span>Dernière utilisation : {formatSettingsDate(key.lastUsedAt)}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => toast(`Clé « ${key.label} » copiée (mock)`)}
                  >
                    <Copy aria-hidden="true" />
                    Copier
                  </Button>
                  {revoked ? null : (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setTarget(key)}>
                      Révoquer
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </SettingsCard>

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer « {target?.label} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les intégrations utilisant cette clé perdraient immédiatement l'accès à l'API. Cette
              action est simulée à ce stade et ne modifie aucune donnée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast(`Clé « ${target?.label} » révoquée (mock)`)}>
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
