import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function AuthLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="text-center text-[18px] font-semibold text-foreground">
          NASSFLOW <span className="text-primary">OS</span>
        </p>
        <Card className="mt-6 border-border bg-card p-6">
          <h1 className="text-[20px] font-medium text-foreground">{title}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">{description}</p>
          <div className="mt-6 flex flex-col gap-4">{children}</div>
        </Card>
        {footer ? (
          <div className="mt-4 text-center text-[13px] text-muted-foreground">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}