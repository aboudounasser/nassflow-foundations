import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import * as authService from "@/services/auth";

/** Renvoie true tant que la vérification de session est en cours. */
export function useRedirectIfAuthenticated(): boolean {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const user = await authService.getCurrentUser();
        if (cancelled) return;
        if (user) {
          void navigate({ to: "/", replace: true });
          return;
        }
      } catch {
        // Pas de session exploitable : on affiche le formulaire.
      }
      if (!cancelled) setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return checking;
}