import React from "react";
import { Link, useParams } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { PageHeader, CardSkeleton } from "@/components/ui/shared";
import { StatusBadge, DamageTypeBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGetFarmer, useGetFarmerClaims, useListFields } from "@workspace/api-client-react";
import { ArrowLeft, UserCircle, MapPin, Phone, CreditCard, Sprout, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function FarmerProfilePage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: farmer, isLoading: isFarmerLoading } = useGetFarmer(id, { query: { enabled: !!id } });
  const { data: claims, isLoading: isClaimsLoading } = useGetFarmerClaims(id, { query: { enabled: !!id } });
  const { data: fields, isLoading: isFieldsLoading } = useListFields({ farmerId: id }, { query: { enabled: !!id } });

  if (isFarmerLoading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
          <CardSkeleton />
        </div>
      </Layout>
    );
  }

  if (!farmer) return null;

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/farmers"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <PageHeader title="Farmer Profile" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col: Bio & Fields */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="bg-primary/10 h-24 w-full relative">
                <div className="absolute -bottom-10 left-6 w-20 h-20 bg-card rounded-full border-4 border-card flex items-center justify-center shadow-sm">
                  <UserCircle className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div className="pt-12 p-6">
                <h2 className="text-2xl font-bold text-foreground">{farmer.name}</h2>
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted text-xs font-mono mt-2 text-muted-foreground border border-border">
                  ID: {farmer.pmfbyId}
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="text-foreground font-medium">{farmer.phone}</div>
                      <div className="text-xs text-muted-foreground">Registered Mobile</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="text-foreground font-medium">
                        {farmer.village && `${farmer.village}, `}{farmer.district}
                      </div>
                      <div className="text-xs text-muted-foreground">{farmer.state}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <CreditCard className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="text-foreground font-medium">Aadhaar (Last 4): {farmer.aadhaarLast4 || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">Bank: {farmer.bankAccount ? `****${farmer.bankAccount.slice(-4)}` : "Not provided"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-primary" /> Registered Fields
                </h3>
                <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {farmer.landHolding} Ha Total
                </span>
              </div>
              <div className="p-0">
                {isFieldsLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Loading fields...</div>
                ) : fields && fields.length > 0 ? (
                  <div className="divide-y divide-border">
                    {fields.map(field => (
                      <div key={field.id} className="p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-sm capitalize">{field.cropType}</span>
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded border border-border">Survey: {field.surveyNumber || "N/A"}</span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-2">
                          <span>{field.areaHectares} Hectares</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span>{field.season} Season</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-muted-foreground">No fields registered.</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Claims History */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-full">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Claim History</h3>
              </div>
              
              <div className="p-0">
                {isClaimsLoading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">Loading claim history...</div>
                ) : claims && claims.length > 0 ? (
                  <div className="divide-y divide-border">
                    {claims.map(claim => (
                      <div key={claim.id} className="p-5 hover:bg-muted/10 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm font-bold">CLM-{claim.id.toString().padStart(6, '0')}</span>
                              <StatusBadge status={claim.status} />
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Submitted {format(new Date(claim.submittedAt), "MMM dd, yyyy")}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/claims/${claim.id}`}>View Details</Link>
                          </Button>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-4 border border-border/50 grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Crop</div>
                            <div className="text-sm font-medium capitalize">{claim.cropType}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Damage Cause</div>
                            <DamageTypeBadge type={claim.damageType} />
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Severity Loss</div>
                            <div className="text-sm font-medium text-destructive">{claim.severityPct}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Estimated Payout</div>
                            <div className="text-sm font-medium">₹{claim.estimatedLoss?.toLocaleString() || "Pending"}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium">No claims filed yet</p>
                    <p className="text-sm text-muted-foreground mt-1">This farmer has a clean record for the current season.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}