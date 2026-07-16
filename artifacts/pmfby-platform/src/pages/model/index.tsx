import React from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/shared";
import { useGetModelStats, useListPredictions } from "@workspace/api-client-react";
import { BrainCircuit, Cpu, Target, Clock, ShieldAlert } from "lucide-react";
import { ConfidenceBadge } from "@/components/ui/badges";
import { format } from "date-fns";

export default function ModelInsightsPage() {
  const { data: stats, isLoading: statsLoading } = useGetModelStats();
  const { data: predictions, isLoading: predsLoading } = useListPredictions({ limit: 10 });

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-8">
        <PageHeader 
          title="AI Model Insights" 
          description="Performance metrics for the Convolutional Neural Network (CNN) damage assessment model."
        />

        {statsLoading ? (
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-6 py-1">
              <div className="h-24 bg-muted rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-64 bg-muted rounded col-span-2"></div>
                  <div className="h-64 bg-muted rounded col-span-1"></div>
                </div>
              </div>
            </div>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Accuracy" value={`${(stats.accuracy * 100).toFixed(1)}%`} icon={Target} color="text-emerald-500" />
              <StatCard title="Avg Confidence" value={`${(stats.avgConfidence * 100).toFixed(1)}%`} icon={BrainCircuit} color="text-primary" />
              <StatCard title="Flag Rate" value={`${(stats.flagRate * 100).toFixed(1)}%`} subtitle="Sent to manual review" icon={ShieldAlert} color="text-warning" />
              <StatCard title="Latency" value={`${stats.avgProcessingMs}ms`} subtitle="Avg per image" icon={Clock} color="text-blue-500" />
              <StatCard title="Processed" value={stats.totalPredictions.toLocaleString()} subtitle="Total images" icon={Cpu} color="text-foreground" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-6">Crop-wise Accuracy</h3>
                <div className="space-y-4">
                  {stats.cropBreakdown?.map(crop => (
                    <div key={crop.cropType}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium">{crop.cropType}</span>
                        <span className="text-muted-foreground">{(crop.accuracy * 100).toFixed(1)}% ({crop.count} samples)</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${crop.accuracy * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-6">Damage Type Accuracy</h3>
                <div className="space-y-4">
                  {stats.damageBreakdown?.map(damage => (
                    <div key={damage.damageType}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize font-medium">{damage.damageType.replace("_", " ")}</span>
                        <span className="text-muted-foreground">{(damage.accuracy * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${damage.accuracy < 0.8 ? 'bg-warning' : 'bg-primary'}`} 
                          style={{ width: `${damage.accuracy * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-lg">Recent Prediction Stream</h3>
          </div>
          {predsLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading stream...</div>
          ) : predictions ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Claim Ref</th>
                    <th className="px-6 py-4">Crop / Damage</th>
                    <th className="px-6 py-4">Prediction</th>
                    <th className="px-6 py-4">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {predictions.map(pred => (
                    <tr key={pred.id} className="hover:bg-muted/10">
                      <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                        {format(new Date(pred.createdAt), "HH:mm:ss.SSS")}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs">
                        CLM-{pred.claimId.toString().padStart(6, '0')}
                      </td>
                      <td className="px-6 py-3">
                        <span className="capitalize font-medium">{pred.cropType}</span>
                        <span className="mx-2 text-muted-foreground">→</span>
                        <span className="capitalize text-muted-foreground">{pred.damageType.replace("_", " ")}</span>
                      </td>
                      <td className="px-6 py-3">
                        <ConfidenceBadge score={pred.confidenceScore} />
                        {pred.flagForManualReview && (
                          <span className="ml-2 text-xs text-warning bg-warning/10 px-1.5 py-0.5 rounded border border-warning/20">Flagged</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground font-mono">
                        {pred.processingTimeMs}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <h4 className="text-2xl font-bold text-foreground">{value}</h4>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}