import React from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, TableSkeleton, EmptyState } from "@/components/ui/shared";
import { useListFields } from "@workspace/api-client-react";
import { Search, Map, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badges";

export default function FieldsPage() {
  const [search, setSearch] = React.useState("");
  const { data: fields, isLoading } = useListFields({ limit: 100 });

  const filteredFields = React.useMemo(() => {
    if (!fields) return [];
    if (!search) return fields;
    const lowerSearch = search.toLowerCase();
    return fields.filter(f => 
      f.farmerName?.toLowerCase().includes(lowerSearch) || 
      f.surveyNumber?.toLowerCase().includes(lowerSearch) ||
      f.cropType.toLowerCase().includes(lowerSearch) ||
      f.district.toLowerCase().includes(lowerSearch)
    );
  }, [fields, search]);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <PageHeader 
          title="Insured Fields Database" 
          description="Geospatial record of all insured agricultural land parcels." 
        />

        <div className="mb-6 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by survey number, crop, or district..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={10} columns={6} />
        ) : !filteredFields || filteredFields.length === 0 ? (
          <EmptyState 
            title="No fields found" 
            description="Try adjusting your search criteria."
            icon={Map}
          />
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Survey No.</th>
                    <th className="px-6 py-4 font-semibold">Farmer</th>
                    <th className="px-6 py-4 font-semibold">Crop & Season</th>
                    <th className="px-6 py-4 font-semibold">Area</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold text-center">GPS Sync</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredFields.map((field) => (
                    <tr key={field.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm font-medium">{field.surveyNumber || "Pending"}</div>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        {field.farmerName || `Farmer #${field.farmerId}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="capitalize font-medium">{field.cropType}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{field.season}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary">{field.areaHectares} Ha</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div>{field.district}</div>
                        <div className="text-xs text-muted-foreground">{field.state}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {field.latitude && field.longitude ? (
                          <div className="flex flex-col items-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {field.latitude.toFixed(4)}, {field.longitude.toFixed(4)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Missing</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-border bg-muted/20 text-xs text-muted-foreground flex justify-between items-center">
              <span>Showing {filteredFields.length} field records</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}