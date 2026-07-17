import React from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/ui/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListFarmers, useListFields, useCreateClaim } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListClaimsQueryKey } from "@workspace/api-client-react";
import {
  Upload, ImagePlus, X, CheckCircle2, Loader2, ArrowLeft, Camera,
  Leaf, CloudRain, Flame, Bug, Wind
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

const CROP_TYPES = ["wheat", "rice", "cotton", "sugarcane", "maize", "soybean", "groundnut", "mustard"];
const DAMAGE_TYPES = [
  { value: "flood", label: "Flood / Waterlogging", icon: CloudRain },
  { value: "drought", label: "Drought / Water Stress", icon: Leaf },
  { value: "pest", label: "Pest / Disease", icon: Bug },
  { value: "fire", label: "Fire Damage", icon: Flame },
  { value: "hailstorm", label: "Hailstorm / Storm", icon: Wind },
  { value: "other", label: "Other", icon: Leaf },
];

type UploadState = "idle" | "uploading" | "done" | "error";

export default function SubmitClaimPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [farmerId, setFarmerId] = React.useState<string>("");
  const [fieldId, setFieldId] = React.useState<string>("");
  const [cropType, setCropType] = React.useState<string>("");
  const [damageType, setDamageType] = React.useState<string>("");
  const [notes, setNotes] = React.useState<string>("");

  // Location
  const [latitude, setLatitude] = React.useState<string>("");
  const [longitude, setLongitude] = React.useState<string>("");
  const [district, setDistrict] = React.useState<string>("");
  const [state, setState] = React.useState<string>("");

  // Image upload state
  const [uploadState, setUploadState] = React.useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [objectPath, setObjectPath] = React.useState<string>("");
  const [previewUrl, setPreviewUrl] = React.useState<string>("");
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { data: farmers } = useListFarmers({ limit: 200 });
  const { data: fields } = useListFields({ farmerId: farmerId ? parseInt(farmerId) : undefined, limit: 200 });
  const createClaim = useCreateClaim();

  // Auto-fill location from geolocation
  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLatitude(pos.coords.latitude.toFixed(6));
      setLongitude(pos.coords.longitude.toFixed(6));
    });
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image (JPG, PNG, WEBP).", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 15 MB.", variant: "destructive" });
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploadState("uploading");
    setUploadProgress(10);

    try {
      // Step 1: get presigned upload URL
      const res = await fetch(`${BASE_URL}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });

      if (!res.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath: path } = await res.json();
      setUploadProgress(30);

      // Step 2: upload directly to GCS
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setUploadProgress(30 + Math.round((e.loaded / e.total) * 60));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(file);
      });

      setUploadProgress(100);
      setObjectPath(path);
      setUploadState("done");
    } catch (err) {
      console.error(err);
      setUploadState("error");
      toast({ title: "Upload failed", description: "Could not upload image. Please try again.", variant: "destructive" });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const clearImage = () => {
    setUploadState("idle");
    setObjectPath("");
    setPreviewUrl("");
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId || !cropType || !damageType || !latitude || !longitude || !district || !state) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrl = objectPath ? `${BASE_URL}/api/storage${objectPath}` : undefined;

      await createClaim.mutateAsync({
        data: {
          farmerId: parseInt(farmerId),
          fieldId: fieldId ? parseInt(fieldId) : undefined,
          cropType,
          damageType,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          district,
          state,
          notes: notes || undefined,
          imageUrl,
          // AI fields get defaults — will be processed by backend
          severityPct: 0,
          confidenceScore: 0,
        },
      });

      await queryClient.invalidateQueries({ queryKey: getListClaimsQueryKey() });
      toast({ title: "Claim submitted", description: "Your damage claim has been submitted for review." });
      setLocation("/claims");
    } catch (err) {
      console.error(err);
      toast({ title: "Submission failed", description: "Could not submit claim. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setLocation("/claims")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Claims
          </button>
          <PageHeader
            title="Submit Damage Claim"
            description="Upload a photo of the damaged crop and provide claim details for AI-assisted assessment."
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Image Upload ── */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Damaged Crop Photo
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a clear photo of the damaged crop. This image will be processed by our CNN model for severity assessment.
            </p>

            <AnimatePresence mode="wait">
              {uploadState === "idle" || uploadState === "error" ? (
                <motion.div
                  key="dropzone"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : uploadState === "error"
                      ? "border-destructive bg-destructive/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                      uploadState === "error" ? "bg-destructive/10" : "bg-primary/10"
                    }`}>
                      <ImagePlus className={`w-7 h-7 ${uploadState === "error" ? "text-destructive" : "text-primary"}`} />
                    </div>
                    <p className="font-semibold text-foreground mb-1">
                      {uploadState === "error" ? "Upload failed — try again" : "Drop photo here or click to browse"}
                    </p>
                    <p className="text-sm text-muted-foreground">JPG, PNG, WEBP · Max 15 MB</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </motion.div>
              ) : uploadState === "uploading" ? (
                <motion.div
                  key="uploading"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  {previewUrl && (
                    <div className="relative h-48 bg-muted">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-background/90 rounded-xl px-6 py-4 text-center shadow-lg">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                          <p className="text-sm font-medium">Uploading… {uploadProgress}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  className="relative border border-primary/30 rounded-xl overflow-hidden bg-primary/5"
                >
                  {previewUrl && (
                    <div className="relative h-52">
                      <img src={previewUrl} alt="Uploaded crop" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-4 flex items-center gap-2 text-white">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Image uploaded successfully</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-3 right-3 bg-background/90 hover:bg-background text-foreground rounded-full p-1.5 shadow transition-colors"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {uploadState === "idle" && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Photo is optional but strongly recommended for faster claim processing
              </p>
            )}
          </div>

          {/* ── Farmer & Field ── */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold">Farmer & Field Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="farmer">Farmer <span className="text-destructive">*</span></Label>
                <Select value={farmerId} onValueChange={setFarmerId}>
                  <SelectTrigger id="farmer" className="bg-background">
                    <SelectValue placeholder="Select farmer…" />
                  </SelectTrigger>
                  <SelectContent>
                    {farmers?.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.name} — {f.pmfbyId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="field">Field (optional)</Label>
                <Select value={fieldId} onValueChange={setFieldId} disabled={!farmerId}>
                  <SelectTrigger id="field" className="bg-background">
                    <SelectValue placeholder={farmerId ? "Select field…" : "Select farmer first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {fields?.map((f) => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {f.surveyNumber} · {f.cropSeason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Crop & Damage ── */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold">Crop & Damage Type</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Crop Type <span className="text-destructive">*</span></Label>
                <Select value={cropType} onValueChange={setCropType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select crop…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CROP_TYPES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Damage Type <span className="text-destructive">*</span></Label>
                <Select value={damageType} onValueChange={setDamageType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select damage…" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Location ── */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Field Location</h2>
              <Button type="button" variant="outline" size="sm" onClick={detectLocation} className="text-xs gap-1.5">
                <Upload className="w-3 h-3" />
                Detect Location
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="lat">Latitude <span className="text-destructive">*</span></Label>
                <Input id="lat" placeholder="e.g. 23.2599" value={latitude} onChange={(e) => setLatitude(e.target.value)} className="bg-background font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lng">Longitude <span className="text-destructive">*</span></Label>
                <Input id="lng" placeholder="e.g. 77.4126" value={longitude} onChange={(e) => setLongitude(e.target.value)} className="bg-background font-mono text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">District <span className="text-destructive">*</span></Label>
                <Input id="district" placeholder="e.g. Indore" value={district} onChange={(e) => setDistrict(e.target.value)} className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                <Input id="state" placeholder="e.g. Madhya Pradesh" value={state} onChange={(e) => setState(e.target.value)} className="bg-background" />
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Describe the damage, when it occurred, estimated area affected…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="bg-background resize-none"
            />
          </div>

          {/* ── Submit ── */}
          <div className="flex gap-3 justify-end pb-8">
            <Button type="button" variant="outline" onClick={() => setLocation("/claims")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || uploadState === "uploading"}
              className="gap-2 min-w-[140px]"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Submit Claim</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
