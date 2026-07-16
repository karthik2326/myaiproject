import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/ui/shared";
import { StatusBadge, ConfidenceBadge, DamageTypeBadge } from "@/components/ui/badges";
import { useListClaims } from "@workspace/api-client-react";
import { ShieldCheck, AlertTriangle, ArrowRight, Activity, CloudRain } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerificationQueuePage() {
  const { data: claims, isLoading } = useListClaims({ status: "flagged", limit: 50 });

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-start justify-between mb-6">
          <PageHeader 
            title="Verification Queue" 
            description="Claims flagged by the AI for mandatory human review due to low confidence or anomalies." 
          />
          <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-2 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">{claims?.length || 0} Critical Flags</span>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : !claims || claims.length === 0 ? (
          <EmptyState 
            title="Queue Empty" 
            description="All flagged claims have been processed. Great job."
            icon={ShieldCheck}
          />
        ) : (
          <div className="space-y-4">
            {claims.map(claim => (
              <div key={claim.id} className="bg-card rounded-xl border border-destructive/20 shadow-sm overflow-hidden flex flex-col md:flex-row hover:border-destructive/40 transition-colors">
                <div className="md:w-64 shrink-0 bg-muted border-r border-border relative">
                  <img 
                    src={claim.imageUrl} 
                    alt="Field" 
                    className="w-full h-full object-cover min-h-[160px]"
                  />
                  <div className="absolute top-2 left-2">
                    <ConfidenceBadge score={claim.confidenceScore} />
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">CLM-{claim.id.toString().padStart(6, '0')}</h3>
                        <p className="text-sm text-muted-foreground">{claim.farmerName} • {claim.district}, {claim.state}</p>
                      </div>
                      <StatusBadge status={claim.status} />
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <DamageTypeBadge type={claim.damageType} />
                      <span className="bg-destructive/10 text-destructive text-xs font-semibold px-2 py-0.5 rounded border border-destructive/20">
                        {claim.severityPct}% Loss Predicted
                      </span>
                    </div>

                    <div className="bg-muted/40 border border-border/50 rounded-md p-3 text-sm flex gap-3">
                      <Activity className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block text-foreground">Flag Reason:</span>
                        <span className="text-muted-foreground">{claim.flagReason || "Model confidence below acceptable threshold for auto-approval."}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border border-dashed">
                    <Button variant="outline" className="text-muted-foreground">Schedule Inspection</Button>
                    <Button asChild>
                      <Link href={`/claims/${claim.id}`}>
                        Review Claim <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}