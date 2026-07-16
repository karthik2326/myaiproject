import React from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/shared";
import { 
  useGetDashboardStats, 
  useGetClaimsByDamage,
  useGetClaimsOverTime
} from "@workspace/api-client-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";

const COLORS = {
  primary: 'hsl(170, 100%, 25%)',
  accent: 'hsl(45, 100%, 50%)',
  warning: 'hsl(30, 100%, 60%)',
  destructive: 'hsl(0, 84%, 45%)',
  success: 'hsl(140, 70%, 40%)',
  muted: 'hsl(160, 20%, 60%)'
};

export default function AnalyticsPage() {
  const { data: stats } = useGetDashboardStats();
  const { data: damageData } = useGetClaimsByDamage();
  const { data: timeData } = useGetClaimsOverTime();

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <PageHeader 
          title="Platform Analytics" 
          description="Macro-level trends across the insurance claim ecosystem." 
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm col-span-3 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-6">Financial Impact Trend</h3>
            <div className="h-[350px] w-full">
              {timeData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/100000).toFixed(1)}L`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      formatter={(val: number) => [`₹${val.toLocaleString()}`, "Est. Payout"]}
                    />
                    <Area type="monotone" dataKey="totalValue" name="Estimated Payout" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse bg-muted/20 rounded-lg">Loading...</div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm col-span-3 lg:col-span-1">
            <h3 className="text-lg font-semibold mb-6">Damage Breakdown</h3>
            <div className="h-[350px] w-full">
              {damageData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={damageData} layout="vertical" margin={{ top: 5, right: 10, left: 50, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="damageType" type="category" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} className="capitalize" tickFormatter={(v) => v.replace("_", " ")} />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--muted)/0.4)'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', textTransform: 'capitalize' }}
                    />
                    <Bar dataKey="count" name="Claims" fill={COLORS.accent} radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse bg-muted/20 rounded-lg">Loading...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}