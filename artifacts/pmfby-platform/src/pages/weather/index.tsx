import React from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, TableSkeleton } from "@/components/ui/shared";
import { useListWeatherEvents } from "@workspace/api-client-react";
import { format } from "date-fns";
import { CloudRain, Wind, Sun, Droplets, MapPin } from "lucide-react";

export default function WeatherPage() {
  const { data: events, isLoading } = useListWeatherEvents({ limit: 50 });

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'drought': return <Sun className="w-5 h-5 text-warning" />;
      case 'flood': return <Droplets className="w-5 h-5 text-blue-500" />;
      case 'cyclone': return <Wind className="w-5 h-5 text-gray-500" />;
      default: return <CloudRain className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <PageHeader 
          title="Meteorological Data" 
          description="Verified district-level weather events used to cross-validate claims." 
        />

        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events?.map(event => (
              <div key={event.id} className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col hover:-translate-y-1 transition-transform duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {getIcon(event.eventType)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg capitalize">{event.eventType}</h3>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border inline-block mt-1 ${
                        event.severity === 'severe' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        event.severity === 'moderate' ? 'bg-warning/10 text-warning border-warning/20' : 
                        'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      }`}>
                        {event.severity}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>{event.district}, {event.state}</div>
                  </div>
                  <div className="text-sm text-foreground bg-muted/30 p-3 rounded border border-border/50">
                    {event.description || "Official meteorological event recorded."}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                  <span>{format(new Date(event.eventDate), "dd MMM yyyy")}</span>
                  {event.ndviIndex && <span className="font-mono">NDVI Drop: {event.ndviIndex}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}