import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Menu } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/components/providers/session-provider";

export function TopBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { session, organizations, switchOrganization, signOut } = useSession();

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

      <div className="ml-auto flex items-center gap-2">
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
            <DropdownMenuItem asChild>
              <Link to="/account">Profil</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                void signOut();
              }}
            >
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
