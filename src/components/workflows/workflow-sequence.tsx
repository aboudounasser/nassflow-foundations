import { Badge } from "@/components/ui/badge";
import { NODE_TYPE } from "@/lib/workflows/meta";
import type { WorkflowNode } from "@/lib/workflows/types";
import { cn } from "@/lib/utils";

function NodeCard({ node, indented = false }: { node: WorkflowNode; indented?: boolean }) {
  const meta = NODE_TYPE[node.type];
  const Icon = meta.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-card p-3",
        indented && "bg-surface",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="min-w-0 text-[14px] font-medium leading-5 text-foreground">{node.label}</p>
          <Badge variant={meta.variant}>{meta.label}</Badge>
          {node.tool ? <Badge variant="neutral">{node.tool}</Badge> : null}
        </div>
        <p className="text-[12px] leading-5 text-muted-foreground">{node.description}</p>
      </div>
    </div>
  );
}

/**
 * Représentation « technique » simple d'un workflow : séquence verticale numérotée,
 * branches if/else en simple retrait avec bordure gauche colorée (aucun SVG).
 */
export function WorkflowSequence({ nodes }: { nodes: WorkflowNode[] }) {
  const branchIds = new Set(
    nodes.flatMap((n) => n.branches?.flatMap((b) => b.nodeIds) ?? []),
  );
  const mainNodes = nodes.filter((n) => !branchIds.has(n.id));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  return (
    <ol className="space-y-3">
      {mainNodes.map((node, index) => (
        <li key={node.id} className="space-y-2">
          <div className="flex items-start gap-3">
            <span className="mt-1 w-6 shrink-0 text-right text-[12px] tabular-nums text-muted-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <NodeCard node={node} />
            </div>
          </div>

          {node.branches?.map((branch) => {
            const isYes = branch.label === "Oui";
            return (
              <div
                key={`${node.id}-${branch.label}`}
                className={cn(
                  "ml-9 space-y-2 border-l-2 pl-4",
                  isYes ? "border-l-success" : "border-l-destructive",
                )}
              >
                <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                  Branche « {branch.label} »
                </p>
                {branch.nodeIds.map((id) => {
                  const child = byId.get(id);
                  return child ? <NodeCard key={id} node={child} indented /> : null;
                })}
              </div>
            );
          })}
        </li>
      ))}
    </ol>
  );
}