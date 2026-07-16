import React from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, TableSkeleton } from "@/components/ui/shared";
import { StatusBadge } from "@/components/ui/badges";
import { useListInspections } from "@workspace/api-client-react";
import { format } from "date-fns";
import { MapPin, Calendar, CheckSquare } from "lucide-react";

export default function InspectionsPage() {
  const { data: inspections, isLoading } = useListInspections({ limit: 50 });

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <PageHeader 
          title="Field Inspections" 
          description="Management of manual surveyor assignments for flagged claims." 
        />

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4">Claim ID</th>
                    <th className="px-6 py-4">Assigned To</th>
                    <th className="px-6 py-4">Schedule</th>
                    <th className="px-6 py-4">Result</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inspections?.map(inspection => (
                    <tr key={inspection.id} className="hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono font-medium text-foreground">
                        CLM-{inspection.claimId.toString().padStart(6, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{inspection.staffName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(inspection.scheduledDate), "MMM dd, yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {inspection.completedDate ? (
                          <div className="flex flex-col gap-1">
                            {inspection.aiOverridden ? (
                              <span className="text-xs font-semibold text-warning bg-warning/10 px-2 py-0.5 rounded inline-block w-fit">AI Overridden</span>
                            ) : (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded inline-block w-fit dark:bg-emerald-500/10 dark:text-emerald-400">AI Confirmed</span>
                            )}
                            <span className="text-xs text-muted-foreground">Verified Loss: {inspection.verifiedSeverity}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inspection.status} />
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