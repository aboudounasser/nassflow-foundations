import { CircleCheck, CircleSlash, Mail, Plug, TriangleAlert, type LucideIcon } from "lucide-react";

import type { ConnectionStatus, GmailCallbackCode } from "./types";

type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "destructive" | "info";

export const CONNECTION_STATUS: Record<
  ConnectionStatus,
  { label: string; variant: BadgeVariant; icon: LucideIcon }
> = {
  active: { label: "Actif", variant: "success", icon: CircleCheck },
  revoked: { label: "Révoqué", variant: "neutral", icon: CircleSlash },
  error: { label: "En erreur", variant: "destructive", icon: TriangleAlert },
};

const PROVIDERS: Record<string, { label: string; icon: LucideIcon }> = {
  gmail: { label: "Gmail", icon: Mail },
};

/** Un fournisseur inconnu de l'interface reste affichable : son code sert de libellé. */
export function providerMeta(provider: string): { label: string; icon: LucideIcon } {
  return PROVIDERS[provider] ?? { label: provider, icon: Plug };
}

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

export function formatConnectionDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return DATE_FMT.format(date);
}

/**
 * Retour de Google traduit pour l'utilisateur final.
 * `connected` porte l'adresse raccordée, les autres codes décrivent un échec
 * dont la cause est déjà arbitrée par l'Edge Function. Le paramètre arrive de
 * l'URL, donc de l'extérieur : il est typé `string` et tout code inconnu
 * retombe sur le message générique.
 */
export function gmailCallbackToast(
  code: GmailCallbackCode | string,
  email: string | null,
): { tone: "success" | "error"; message: string } {
  switch (code) {
    case "connected":
      return { tone: "success", message: email ? `Gmail connecté : ${email}` : "Gmail connecté" };
    case "refused":
      return { tone: "error", message: "Vous avez refusé l'autorisation." };
    case "expired":
      return { tone: "error", message: "La demande a expiré, réessayez." };
    case "no_refresh":
      return {
        tone: "error",
        message: "Google n'a pas fourni d'accès durable. Réessayez en autorisant à nouveau.",
      };
    case "invalid":
      return { tone: "error", message: "Demande de connexion invalide. Relancez la connexion." };
    case "token_error":
      return {
        tone: "error",
        message: "Google a refusé l'échange de jetons. Réessayez dans un instant.",
      };
    case "profile_error":
      return {
        tone: "error",
        message: "Impossible de lire le profil du compte Google. Réessayez.",
      };
    case "vault_error":
      return {
        tone: "error",
        message: "L'enregistrement sécurisé des jetons a échoué. Réessayez.",
      };
    case "save_error":
      return {
        tone: "error",
        message: "La connexion n'a pas pu être enregistrée. Réessayez.",
      };
    default:
      return { tone: "error", message: "La connexion Gmail a échoué. Réessayez." };
  }
}
