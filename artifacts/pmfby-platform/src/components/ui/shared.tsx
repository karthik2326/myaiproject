import React from "react";
import { Badge } from "@/components/ui/badges";

export function SkeletonRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border/50 animate-pulse">
      {Array.from({ length: columns }).map((_, i) => (
        <div key={i} className="h-4 bg-muted rounded w-1/4 mx-2"></div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="w-full bg-card rounded-md border border-border shadow-sm overflow-hidden">
      <div className="bg-muted/50 p-4 border-b border-border flex justify-between">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-muted-foreground/20 rounded w-1/5 mx-2"></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} columns={columns} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm animate-pulse">
      <div className="h-5 w-1/3 bg-muted rounded mb-4"></div>
      <div className="h-8 w-1/2 bg-muted rounded mb-2"></div>
      <div className="h-4 w-2/3 bg-muted/50 rounded"></div>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string, description?: string, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon }: { title: string, description: string, icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl border-dashed border-border bg-card/50">
      {Icon && <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
    </div>
  );
}