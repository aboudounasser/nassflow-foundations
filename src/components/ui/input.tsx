import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

/** NASSFLOW OS Input — height 44px, radius 12px. */
export interface InputProps extends React.ComponentProps<"input"> {
  invalid?: boolean;
  success?: boolean;
}

const inputBase =
  "flex h-11 w-full rounded-lg border border-border bg-card px-4 text-[14px] text-foreground transition-colors duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid, success, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        inputBase,
        invalid && "border-destructive focus-visible:border-destructive",
        success && "border-success focus-visible:border-success",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input ref={ref} type="search" className={cn("pl-12", className)} {...props} />
    </div>
  ),
);
SearchInput.displayName = "SearchInput";

export { Input, SearchInput, inputBase };
