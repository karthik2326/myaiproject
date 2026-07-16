import React from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, TableSkeleton } from "@/components/ui/shared";
import { useListAnomalies, useResolveAnomaly, getListAnomaliesQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ShieldAlert, CheckCircle2, AlertTriangle, Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function AnomaliesPage() {
  const { data: anomalies, isLoading } = useListAnomalies({ limit: 50 });
  const resolveAnomaly = useResolveAnomaly();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleResolve = (id: number) => {
    resolveAnomaly.mutate({
      id,
      data: { resolvedBy: "Admin", resolution: "Investigated and cleared" }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAnomaliesQueryKey() });
        toast({ title: "Anomaly Resolved", description: "The anomaly has been marked as resolved." });
      }
    });
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <PageHeader 
          title="Fraud & Anomaly Detection" 
          description="System-detected irregularities like duplicate images or metadata manipulation." 
        />

        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Detected At</th>
                    <th className="px-6 py-4">Claim Ref</th>
                    <th className="px-6 py-4">Type & Severity</th>
                    <th className="px-6 py-4 w-1/3">Description</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {anomalies?.map(anomaly => (
                    <tr key={anomaly.id} className={`transition-colors ${anomaly.resolved ? 'opacity-60 bg-muted/10' : 'hover:bg-muted/30'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                        {format(new Date(anomaly.createdAt), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-foreground">
                        CLM-{anomaly.claimId.toString().padStart(6, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          {anomaly.anomalyType === "duplicate_image" ? <Fingerprint className="w-4 h-4 text-muted-foreground" /> : <AlertTriangle className="w-4 h-4 text-muted-foreground" />}
                          <span className="font-semibold capitalize text-foreground">{anomaly.anomalyType.replace("_", " ")}</span>
                        </div>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${
                          anomaly.severity === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                          anomaly.severity === 'high' ? 'bg-warning/10 text-warning border-warning/20' : 
                          'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {anomaly.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {anomaly.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {anomaly.resolved ? (
                          <div className="flex items-center justify-end gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="w-4 h-4" /> Resolved
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleResolve(anomaly.id)}
                            disabled={resolveAnomaly.isPending}
                          >
                            Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}