import { useState, type FormEvent } from "react";

import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as authService from "@/services/auth";

const INDUSTRIES = [
  "Services",
  "Industrie",
  "Commerce",
  "Technologie",
  "Santé",
  "Finance",
  "Éducation",
  "Secteur public",
  "Autre",
];

const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

const DESCRIPTION =
  "C'est l'espace de travail de votre entreprise dans NASSFLOW OS. Vous pourrez le modifier plus tard.";

export function OnboardingScreen({
  onCreated,
  onSignOut,
}: {
  onCreated: () => void;
  onSignOut: () => void;
}) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    if (name.trim().length < 2) {
      setError("Le nom doit contenir au moins 2 caractères.");
      return;
    }
    setPending(true);
    setError(null);
    void (async () => {
      try {
        const organization = await authService.createOrganization(name.trim());
        if (industry || size) {
          try {
            await authService.updateOrganizationDetails(organization.id, { industry, size });
          } catch {
            // Champs facultatifs : l'organisation existe, on n'interrompt pas le parcours.
          }
        }
        onCreated();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Création impossible.");
      } finally {
        setPending(false);
      }
    })();
  };

  return (
    <AuthLayout
      title="Créer votre organisation"
      description={DESCRIPTION}
      footer={
        <Button type="button" variant="ghost" className="w-full" onClick={onSignOut}>
          Se déconnecter
        </Button>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="space-y-1.5">
          <Label htmlFor="org-name">Nom de l&apos;organisation</Label>
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="organization"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-industry">Secteur d&apos;activité</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger id="org-industry" className="w-full">
              <SelectValue placeholder="Sélectionner un secteur" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-size">Taille</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger id="org-size" className="w-full">
              <SelectValue placeholder="Sélectionner une taille" />
            </SelectTrigger>
            <SelectContent>
              {SIZES.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[12px] text-muted-foreground">
            Facultatif — vous pourrez compléter plus tard.
          </p>
        </div>

        {error ? (
          <p className="text-[13px] text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Un instant…" : "Créer l'organisation"}
        </Button>
      </form>
    </AuthLayout>
  );
}
