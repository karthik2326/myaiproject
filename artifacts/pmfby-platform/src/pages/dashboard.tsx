import React from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, CardSkeleton } from "@/components/ui/shared";
import { 
  useGetDashboardStats, 
  useGetClaimsByStatus,
  useGetClaimsByDamage,
  useGetSeverityDistribution,
  useGetClaimsOverTime
} from "@workspace/api-client-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from "recharts";
import { ArrowUpRight, TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";

const COLORS = {
  primary: 'hsl(170, 100%, 25%)',
  accent: 'hsl(45, 100%, 50%)',
  warning: 'hsl(30, 100%, 60%)',
  destructive: 'hsl(0, 84%, 45%)',
  success: 'hsl(140, 70%, 40%)',
  muted: 'hsl(160, 20%, 60%)'
};

const PIE_COLORS = [COLORS.primary, COLORS.warning, COLORS.destructive, COLORS.success, COLORS.muted];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: statusData } = useGetClaimsByStatus();
  const { data: damageData } = useGetClaimsByDamage();
  const { data: timeData } = useGetClaimsOverTime();

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
        <PageHeader 
          title="Command Center" 
          description="Real-time overview of PMFBY AI claim processing."
        />

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Claims" 
              value={stats.totalClaims.toLocaleString()} 
              subtitle="This Season"
              icon={TrendingUp}
              trend="+12% from last week"
              trendUp={true}
            />
            <StatCard 
              title="Pending Review" 
              value={stats.pendingClaims.toLocaleString()} 
              subtitle="Awaiting action"
              icon={Clock}
              trend={`${stats.underReviewClaims} under active review`}
              className="border-l-4 border-l-warning"
            />
            <StatCard 
              title="Auto-Approved" 
              value={stats.approvedClaims.toLocaleString()} 
              subtitle="By CNN Model"
              icon={CheckCircle2}
              trend={`${((stats.approvedClaims / stats.totalClaims) * 100).toFixed(1)}% auto-approval rate`}
              className="border-l-4 border-l-primary"
            />
            <StatCard 
              title="Anomalies Flagged" 
              value={stats.totalAnomalies.toLocaleString()} 
              subtitle={`${stats.unresolvedAnomalies} unresolved`}
              icon={AlertTriangle}
              trend="Requires immediate attention"
              trendUp={false}
              className="border-l-4 border-l-destructive"
              linkTo="/anomalies"
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 text-foreground">Claims Volume Over Time</h3>
            <div className="h-[300px] w-full">
              {timeData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area type="monotone" dataKey="count" name="Total Claims" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    <Line type="monotone" dataKey="approvedCount" name="Approved" stroke={COLORS.success} strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse bg-muted/20 rounded-lg">Loading chart...</div>
              )}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-6 text-foreground">Status Distribution</h3>
            <div className="h-[250px] w-full flex items-center justify-center">
              {statusData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="status"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', textTransform: 'capitalize' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground animate-pulse">Loading...</div>
              )}
            </div>
            {statusData && (
              <div className="mt-4 space-y-2">
                {statusData.map((item, i) => (
                  <div key={item.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></div>
                      <span className="capitalize text-muted-foreground">{item.status.replace("_", " ")}</span>
                    </div>
                    <span className="font-semibold">{item.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-foreground">Top Damage Causes</h3>
              <Link href="/analytics" className="text-sm text-primary hover:underline flex items-center gap-1">
                Full Report <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="h-[300px] w-full">
              {damageData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={damageData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="damageType" type="category" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} className="capitalize" tickFormatter={(v) => v.replace("_", " ")} />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--muted)/0.4)'}}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', textTransform: 'capitalize' }}
                    />
                    <Bar dataKey="count" name="Claims" fill={COLORS.accent} radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground animate-pulse bg-muted/20 rounded-lg">Loading...</div>
              )}
            </div>
          </div>
          
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border bg-muted/20">
              <h3 className="text-lg font-semibold text-foreground">Action Required</h3>
              <p className="text-sm text-muted-foreground mt-1">High-priority claims awaiting manual review.</p>
            </div>
            <div className="flex-1 p-0 flex flex-col justify-center items-center py-12">
              <AlertTriangle className="w-12 h-12 text-warning mb-4 opacity-80" />
              <h4 className="text-xl font-bold">{stats?.flaggedClaims || 0} Claims Flagged</h4>
              <p className="text-muted-foreground text-sm mt-2 max-w-[250px] text-center mb-6">
                Model confidence is low or weather cross-validation failed.
              </p>
              <Link href="/verification" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md font-medium text-sm transition-colors">
                Open Verification Queue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, className = "", linkTo }: any) {
  const content = (
    <div className={`bg-card rounded-xl border border-border p-6 shadow-sm hover-elevate transition-all ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h4 className="text-3xl font-bold text-foreground mt-1 tracking-tight">{value}</h4>
        </div>
        <div className="p-2 bg-muted rounded-lg">
          <Icon className="w-5 h-5 text-foreground/70" />
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{subtitle}</span>
        {trend && (
          <span className={`font-medium ${trendUp === true ? 'text-success' : trendUp === false ? 'text-destructive' : 'text-primary'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return <Link href={linkTo} className="block">{content}</Link>;
  }
  return content;
}