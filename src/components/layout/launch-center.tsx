import { Link } from "@tanstack/react-router";
import { Bot, Plug, Plus, Target, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LAUNCH_ACTIONS = [
  {
    label: "Créer une Mission",
    description: "Confier un objectif métier à vos agents",
    icon: Target,
    to: "/missions",
    search: { new: true },
  },
  {
    label: "Déployer un Agent",
    description: "Ajouter un collaborateur IA à votre AI Workforce",
    icon: Bot,
    to: "/agents",
  },
  {
    label: "Connecter une Intégration",
    description: "Relier un outil externe à la plateforme",
    icon: Plug,
    to: "/integrations-hub",
  },
  {
    label: "Inviter un collaborateur",
    description: "Ajouter un membre à votre organisation",
    icon: UserPlus,
    to: "/organization",
  },
] as const;

export function LaunchCenter() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="hidden md:inline-flex">
          <Plus />
          Lancer
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Launch Center</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LAUNCH_ACTIONS.map((action) => (
          <DropdownMenuItem key={action.label} asChild>
            <Link
              to={action.to}
              search={"search" in action ? action.search : undefined}
              className="flex items-start gap-3"
            >
              <action.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="flex flex-col">
                <span className="text-[14px] text-foreground">{action.label}</span>
                <span className="text-[12px] text-muted-foreground">{action.description}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}