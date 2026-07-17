import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/ui/shared";
import { StatusBadge, DamageTypeBadge, ConfidenceBadge } from "@/components/ui/badges";
import { useListClaims } from "@workspace/api-client-react";
import { Search, Filter, ArrowRight, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

export default function ClaimsPage() {
  const [status, setStatus] = React.useState<string>("all");
  const [search, setSearch] = React.useState("");

  const params = React.useMemo(() => {
    const p: any = { limit: 50 };
    if (status && status !== "all") p.status = status;
    return p;
  }, [status]);

  const { data: claims, isLoading } = useListClaims(params);

  const filteredClaims = React.useMemo(() => {
    if (!claims) return [];
    if (!search) return claims;
    const lowerSearch = search.toLowerCase();
    return claims.filter(c => 
      c.farmerName?.toLowerCase().includes(lowerSearch) || 
      c.district?.toLowerCase().includes(lowerSearch) ||
      c.cropType.toLowerCase().includes(lowerSearch)
    );
  }, [claims, search]);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <PageHeader 
            title="Crop Damage Claims" 
            description="Manage and review AI-processed damage claims across all districts." 
          />
          <Link href="/claims/submit">
            <Button className="gap-2 shrink-0">
              <PlusCircle className="w-4 h-4" />
              Submit Claim
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by farmer name, district or crop..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full bg-background"
            />
          </div>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[180px] bg-background">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : !filteredClaims || filteredClaims.length === 0 ? (
          <EmptyState 
            title="No claims found" 
            description={search || status !== "all" ? "Try adjusting your search filters." : "No claims have been submitted yet."}
            icon={FileText}
          />
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Claim ID & Date</th>
                    <th className="px-6 py-4 font-semibold">Farmer & Location</th>
                    <th className="px-6 py-4 font-semibold">Crop & Damage</th>
                    <th className="px-6 py-4 font-semibold">AI Assessment</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-mono font-medium text-foreground">CLM-{claim.id.toString().padStart(6, '0')}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(claim.submittedAt), "dd MMM yyyy")}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{claim.farmerName || `Farmer #${claim.farmerId}`}</div>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {claim.district || "Unknown"}, {claim.state || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium capitalize text-foreground">{claim.cropType}</div>
                        <div className="mt-1">
                          <DamageTypeBadge type={claim.damageType} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold w-12">{claim.severityPct}%</span>
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${claim.severityPct > 70 ? 'bg-destructive' : claim.severityPct > 30 ? 'bg-warning' : 'bg-primary'}`} 
                              style={{ width: `${claim.severityPct}%` }}
                            />
                          </div>
                        </div>
                        <ConfidenceBadge score={claim.confidenceScore} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/claims/${claim.id}`}>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground flex justify-between items-center">
              <span>Showing {filteredClaims.length} claims</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

import { FileText, MapPin } from "lucide-react";