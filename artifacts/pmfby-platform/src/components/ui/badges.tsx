import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertCircle, Clock, ShieldAlert } from "lucide-react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary ring-primary/20",
        secondary: "bg-secondary/50 text-secondary-foreground ring-secondary/20",
        outline: "text-foreground ring-border",
        success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400",
        destructive: "bg-destructive/10 text-destructive ring-destructive/20",
        warning: "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400",
        info: "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export function StatusBadge({ status }: { status: string }) {
  let variant: BadgeProps["variant"] = "default";
  let icon = null;

  switch (status.toLowerCase()) {
    case "approved":
    case "resolved":
    case "completed":
      variant = "success";
      icon = <CheckCircle2 className="mr-1 h-3 w-3" />;
      break;
    case "rejected":
    case "failed":
      variant = "destructive";
      icon = <XCircle className="mr-1 h-3 w-3" />;
      break;
    case "flagged":
    case "critical":
      variant = "warning";
      icon = <AlertCircle className="mr-1 h-3 w-3" />;
      break;
    case "under_review":
    case "pending":
    case "scheduled":
      variant = "info";
      icon = <Clock className="mr-1 h-3 w-3" />;
      break;
  }

  return (
    <Badge variant={variant} className="capitalize">
      {icon}
      {status.replace("_", " ")}
    </Badge>
  );
}

export function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  
  let variant: BadgeProps["variant"] = "success";
  if (percentage < 70) variant = "destructive";
  else if (percentage < 85) variant = "warning";

  return (
    <Badge variant={variant} className="font-mono">
      {percentage}% Conf
    </Badge>
  );
}

export function DamageTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" className="capitalize whitespace-nowrap">
      {type.replace("_", " ")}
    </Badge>
  );
}