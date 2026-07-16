import React from "react";
import { Link, useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { 
  useGetClaim, 
  useListPredictions, 
  useGetFarmer, 
  useGetField, 
  useApproveClaim,
  useRejectClaim,
  useFlagClaim,
  getGetClaimQueryKey,
  getListClaimsQueryKey
} from "@workspace/api-client-react";
import { PageHeader, CardSkeleton } from "@/components/ui/shared";
import { StatusBadge, ConfidenceBadge, DamageTypeBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { 
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle, 
  Map, User, Sprout, CloudRain, BrainCircuit, Activity
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function ClaimDetailPage() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: claim, isLoading: isClaimLoading } = useGetClaim(id, { 
    query: { enabled: !!id } 
  });
  
  const { data: predictions } = useListPredictions({ claimId: id }, {
    query: { enabled: !!id }
  });
  
  const prediction = predictions?.[0];

  const { data: farmer } = useGetFarmer(claim?.farmerId || 0, {
    query: { enabled: !!claim?.farmerId }
  });

  const { data: field } = useGetField(claim?.fieldId || 0, {
    query: { enabled: !!claim?.fieldId }
  });

  const approveClaim = useApproveClaim();
  const rejectClaim = useRejectClaim();
  const flagClaim = useFlagClaim();

  const [notes, setNotes] = React.useState("");
  const [isApproveOpen, setIsApproveOpen] = React.useState(false);
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [isFlagOpen, setIsFlagOpen] = React.useState(false);

  if (isClaimLoading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
          <div className="flex gap-4 mb-8">
            <div className="w-10 h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded w-64 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <div className="space-y-6">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!claim) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-[1200px] mx-auto text-center mt-20">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Claim Not Found</h2>
          <p className="text-muted-foreground mt-2 mb-6">The claim you are looking for does not exist or you don't have access.</p>
          <Button asChild>
            <Link href="/claims">Back to Claims</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleAction = (action: 'approve' | 'reject' | 'flag') => {
    const commonData = { reviewedBy: "Current User", notes };
    
    let mutateFn;
    switch (action) {
      case 'approve':
        mutateFn = approveClaim.mutate;
        setIsApproveOpen(false);
        break;
      case 'reject':
        mutateFn = rejectClaim.mutate;
        setIsRejectOpen(false);
        break;
      case 'flag':
        mutateFn = flagClaim.mutate;
        setIsFlagOpen(false);
        break;
    }

    mutateFn(
      { id, data: action === 'flag' ? { ...commonData, flagReason: notes || "Manual flag" } : commonData },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetClaimQueryKey(id), data);
          queryClient.invalidateQueries({ queryKey: getListClaimsQueryKey() });
          toast({
            title: `Claim ${action}d successfully`,
            description: `Claim CLM-${id.toString().padStart(6, '0')} has been updated.`,
          });
          setNotes("");
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Action failed",
            description: "There was an error processing your request.",
          });
        }
      }
    );
  };

  const isPending = claim.status === "pending" || claim.status === "under_review" || claim.status === "flagged";

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" asChild className="shrink-0">
            <Link href="/claims">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Claim CLM-{claim.id.toString().padStart(6, '0')}</h1>
              <StatusBadge status={claim.status} />
              {prediction?.flagForManualReview && (
                <StatusBadge status="flagged" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Submitted on {format(new Date(claim.submittedAt), "dd MMMM yyyy, HH:mm")}
            </p>
          </div>
          
          {isPending && (
            <div className="flex items-center gap-2">
              <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reject Claim</DialogTitle>
                    <DialogDescription>
                      Provide a reason for rejecting this claim. This will be recorded in the claim history.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea 
                    placeholder="Rejection reason..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={() => handleAction('reject')} disabled={rejectClaim.isPending}>
                      Confirm Rejection
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isFlagOpen} onOpenChange={setIsFlagOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-warning border-warning/30 hover:bg-warning/10">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Flag for Review
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Flag Claim</DialogTitle>
                    <DialogDescription>
                      Flag this claim for further investigation or physical inspection.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea 
                    placeholder="Why does this need review? e.g. Image unclear, GPS mismatch..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsFlagOpen(false)}>Cancel</Button>
                    <Button className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={() => handleAction('flag')} disabled={flagClaim.isPending}>
                      Flag Claim
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve Claim</DialogTitle>
                    <DialogDescription>
                      You are approving {claim.severityPct}% damage for {claim.cropType}.
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea 
                    placeholder="Approval notes (optional)..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Cancel</Button>
                    <Button onClick={() => handleAction('approve')} disabled={approveClaim.isPending}>
                      Confirm Approval
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Image & AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-primary" />
                  CNN Model Analysis
                </h2>
                <div className="text-xs text-muted-foreground">Model v2.4.1</div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border relative group">
                      <img 
                        src={claim.imageUrl} 
                        alt="Crop Damage" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1595841696677-647fa50e01da?auto=format&fit=crop&q=80&w=800";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button variant="secondary" size="sm">View Full Resolution</Button>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Map className="w-3 h-3" />
                        {claim.latitude.toFixed(6)}, {claim.longitude.toFixed(6)}
                      </div>
                      <div>Captured via PMFBY App</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Detected Crop</div>
                      <div className="text-xl font-bold capitalize text-foreground">{claim.cropType}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Damage Classification</div>
                      <div className="flex items-center gap-3">
                        <DamageTypeBadge type={claim.damageType} />
                        {prediction?.weatherCorroborated && (
                          <span className="text-xs flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded dark:bg-emerald-500/10 dark:text-emerald-400">
                            <CloudRain className="w-3 h-3" /> Corroborated by weather data
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-2 flex justify-between">
                        <span>Assessed Severity</span>
                        <span className="font-bold text-foreground">{claim.severityPct}% Loss</span>
                      </div>
                      <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${claim.severityPct > 70 ? 'bg-destructive' : claim.severityPct > 30 ? 'bg-warning' : 'bg-primary'}`} 
                          style={{ width: `${claim.severityPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Model Confidence</div>
                      <div className="flex items-center gap-4">
                        <ConfidenceBadge score={claim.confidenceScore} />
                        <span className="text-xs text-muted-foreground">
                          {prediction?.processingTimeMs}ms processing time
                        </span>
                      </div>
                    </div>

                    {prediction?.anomalyDetected && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 flex items-start gap-2 text-sm text-destructive-foreground">
                        <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Anomaly Detected</p>
                          <p className="opacity-90">Image metadata does not match GPS coordinates of the insured field.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Verification / Notes Card */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <h2 className="font-semibold">Review History & Notes</h2>
              </div>
              <div className="p-6">
                {claim.notes || claim.flagReason || claim.reviewedBy ? (
                  <div className="space-y-4">
                    {claim.flagReason && (
                      <div className="bg-warning/10 border border-warning/20 rounded-md p-4">
                        <div className="text-xs font-semibold text-warning-foreground uppercase tracking-wider mb-1">Flag Reason</div>
                        <p className="text-sm text-foreground">{claim.flagReason}</p>
                      </div>
                    )}
                    {claim.notes && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Reviewer Notes</div>
                        <p className="text-sm bg-muted/30 p-3 rounded-md border border-border/50">{claim.notes}</p>
                      </div>
                    )}
                    {claim.reviewedBy && (
                      <div className="text-xs text-muted-foreground">
                        Last reviewed by <span className="font-medium">{claim.reviewedBy}</span> 
                        {claim.reviewedAt && ` on ${format(new Date(claim.reviewedAt), "dd MMM yyyy, HH:mm")}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No review notes added yet.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Farmer & Field Data */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">Farmer Details</h2>
              </div>
              <div className="p-5 space-y-4">
                {farmer ? (
                  <>
                    <div>
                      <div className="text-lg font-bold text-foreground">{farmer.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">PMFBY ID: {farmer.pmfbyId}</div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Phone</div>
                        <div className="font-medium">{farmer.phone}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Aadhaar (Last 4)</div>
                        <div className="font-medium">XXXX-{farmer.aadhaarLast4 || "XXXX"}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-1 text-xs">Address</div>
                        <div className="font-medium">{farmer.village && `${farmer.village}, `}{farmer.district}, {farmer.state}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-muted-foreground mb-1 text-xs">Total Land Holding</div>
                        <div className="font-medium">{farmer.landHolding} Hectares</div>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full text-xs" asChild>
                      <Link href={`/farmers/${farmer.id}`}>View Full Profile</Link>
                    </Button>
                  </>
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">Loading farmer data...</div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-semibold">Insured Field</h2>
              </div>
              <div className="p-5 space-y-4">
                {field ? (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground mb-1">Survey Number</div>
                        <div className="font-bold text-foreground">{field.surveyNumber || "N/A"}</div>
                      </div>
                      <Badge variant="outline">{field.season}</Badge>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Area</div>
                        <div className="font-medium">{field.areaHectares} Ha</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Crop</div>
                        <div className="font-medium capitalize">{field.cropType}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Soil Type</div>
                        <div className="font-medium">{field.soilType || "Unknown"}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-xs">Irrigation</div>
                        <div className="font-medium">{field.irrigationType || "Unknown"}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-sm text-muted-foreground animate-pulse">Loading field data...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { Badge } from "@/components/ui/badges";