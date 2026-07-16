import React from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, TableSkeleton } from "@/components/ui/shared";
import { useListDataCollections } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Database, Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badges";

export default function DataCollectionPage() {
  const { data: collections, isLoading } = useListDataCollections({ limit: 40 });

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <PageHeader 
          title="CNN Training Dataset" 
          description="Ground-truth imagery collected by agronomists to continuously improve model accuracy." 
        />

        {isLoading ? (
          <TableSkeleton rows={3} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {collections?.map(item => (
              <div key={item.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden group">
                <div className="aspect-square bg-muted relative">
                  <img src={item.imageUrl} alt="Training Sample" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2">
                    {item.annotated ? (
                      <Badge variant="success">Annotated</Badge>
                    ) : (
                      <Badge variant="warning">Needs Label</Badge>
                    )}
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold capitalize text-foreground">{item.cropType}</span>
                    <span className="text-xs font-mono text-muted-foreground">Q-Score: {item.qualityScore || 'N/A'}</span>
                  </div>
                  {item.damageType && (
                    <div className="text-xs font-medium text-muted-foreground capitalize">
                      Label: {item.damageType.replace("_", " ")} ({item.severityLabel || 'none'})
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground flex justify-between pt-2 border-t border-border mt-2">
                    <span>{item.district}</span>
                    <span>{format(new Date(item.createdAt), "dd MMM")}</span>
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