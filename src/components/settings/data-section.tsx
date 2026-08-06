import { Database, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SettingRow, SettingsCard } from "@/components/settings/settings-rows";
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
import { Button } from "@/components/ui/button";
import { formatSettingsDate } from "@/lib/settings/meta";
import { dataSettingsMock } from "@/lib/settings/mocks";

export function DataSection() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const d = dataSettingsMock;

  return (
    <>
      <SettingsCard title="Données & export">
        <SettingRow label="Format d'export">{d.exportFormat}</SettingRow>
        <SettingRow label="Rétention des missions">{d.retentionMissions}</SettingRow>
        <SettingRow label="Rétention des logs">{d.retentionLogs}</SettingRow>
        <SettingRow label="Fréquence de sauvegarde">{d.backupFrequency}</SettingRow>
        <SettingRow label="Dernière sauvegarde">{formatSettingsDate(d.lastBackupAt)}</SettingRow>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => toast("Export de toutes les données lancé (mock)")}
          >
            <Download aria-hidden="true" />
            Exporter toutes les données
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => toast("Sauvegarde manuelle lancée (mock)")}
          >
            <Database aria-hidden="true" />
            Lancer une sauvegarde
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            Supprimer toutes les données
          </Button>
        </div>
      </SettingsCard>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer toutes les données ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette opération effacerait missions, agents, workflows et journaux de l'espace de
              travail. Cette action est simulée à ce stade et ne supprime rien.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => toast("Suppression totale simulée — aucune donnée effacée")}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}