import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/ui/shared";
import { useListFarmers } from "@workspace/api-client-react";
import { Search, MapPin, ChevronRight, UserCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function FarmersPage() {
  const [search, setSearch] = React.useState("");
  const { data: farmers, isLoading } = useListFarmers({ limit: 50 });

  const filteredFarmers = React.useMemo(() => {
    if (!farmers) return [];
    if (!search) return farmers;
    const lowerSearch = search.toLowerCase();
    return farmers.filter(f => 
      f.name.toLowerCase().includes(lowerSearch) || 
      f.pmfbyId.toLowerCase().includes(lowerSearch) ||
      f.phone.includes(search)
    );
  }, [farmers, search]);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <PageHeader 
          title="Farmer Registry" 
          description="Database of insured farmers under PMFBY." 
        />

        <div className="mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, PMFBY ID, or phone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} columns={5} />
        ) : !filteredFarmers || filteredFarmers.length === 0 ? (
          <EmptyState 
            title="No farmers found" 
            description="Try adjusting your search criteria."
            icon={UserCircle}
          />
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Farmer Name</th>
                    <th className="px-6 py-4 font-semibold">PMFBY ID & Contact</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Land Holding</th>
                    <th className="px-6 py-4 font-semibold text-right">Total Claims</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {farmer.name.charAt(0)}
                          </div>
                          {farmer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs mb-1 bg-muted inline-block px-1.5 py-0.5 rounded">{farmer.pmfbyId}</div>
                        <div className="text-muted-foreground">{farmer.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          {farmer.village && `${farmer.village}, `}{farmer.district}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 ml-5">{farmer.state}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {farmer.landHolding} <span className="text-muted-foreground font-normal">Ha</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${farmer.totalClaims > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          {farmer.totalClaims}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" asChild className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/farmers/${farmer.id}`}>
                            View Profile <ChevronRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground flex justify-between items-center">
              <span>Showing {filteredFarmers.length} registered farmers</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}