import { Link } from "@tanstack/react-router";
import { Bell, Check, ChevronDown, Menu, PanelRight } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LaunchCenter } from "@/components/layout/launch-center";
import { useSession } from "@/components/providers/session-provider";

export function TopBar({
  onOpenMenu,
  onOpenContext,
}: {
  onOpenMenu: () => void;
  onOpenContext: () => void;
}) {
  const { session, organizations, switchOrganization } = useSession();

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-4 border-b border-border bg-surface px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMenu}
        aria-label="Ouvrir la navigation"
      >
        <Menu />
      </Button>

      <Link
        to="/"
        className="rounded-lg text-[16px] font-semibold tracking-tight text-foreground"
        aria-label="NASSFLOW OS — accueil"
      >
        NASSFLOW<span className="text-primary"> OS</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className="hidden md:inline-flex"
            aria-label="Changer d'organisation"
          >
            {session.organization.name}
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Organisations</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.map((o) => (
            <DropdownMenuItem key={o.id} onClick={() => switchOrganization(o.id)}>
              {o.name}
              {o.id === session.organization.id ? (
                <Check className="ml-auto size-4" aria-hidden="true" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <LaunchCenter />

      <div className="mx-auto hidden w-full max-w-[520px] lg:block">
        <SearchInput placeholder="Rechercher... (⌘K)" aria-label="Recherche universelle" />
      </div>

      <div className="ml-auto flex items-center gap-2 lg:ml-0">
        <span
          className="hidden items-center gap-2 rounded-lg border border-border px-3 py-2 md:inline-flex"
          title="Services IA opérationnels"
        >
          <span className="size-2 rounded-full bg-success" aria-hidden="true" />
          <span className="text-[14px] text-muted-foreground">AI Status</span>
        </span>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications (3)">
          <Bell />
          <Badge
            variant="primary"
            className="pointer-events-none absolute right-1 top-1 min-w-4 justify-center px-1 py-0 text-[10px] leading-4"
          >
            3
          </Badge>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden"
          onClick={onOpenContext}
          aria-label="Ouvrir le panneau contextuel"
        >
          <PanelRight />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Menu utilisateur">
              <Avatar className="size-8">
                <AvatarFallback className="bg-card text-[12px] text-foreground">
                  {session.initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{session.name}</DropdownMenuLabel>
            <DropdownMenuLabel className="pt-0 font-normal text-muted-foreground">
              {session.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled title="Bientôt disponible">
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/system-settings">Préférences</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast("Déconnexion (mock)")}>
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
