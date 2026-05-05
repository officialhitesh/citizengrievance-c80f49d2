import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Upload, Locate, X } from "lucide-react";
import { toast } from "sonner";
import LocationPicker from "@/components/LocationPicker";
import { INDIA_STATES, INDIA_STATE_NAMES } from "@/data/indiaStates";

export interface ComplaintFormValues {
  title: string;
  description: string;
  state: string;
  city: string;
  address: string;
  imageFile: File | null;
  imagePreview: string;
  existingImageUrl: string | null;
  removeExistingImage: boolean;
  coords: { lat: number; lng: number } | null;
}

interface Props {
  values: ComplaintFormValues;
  onChange: (patch: Partial<ComplaintFormValues>) => void;
}

const ComplaintForm = ({ values, onChange }: Props) => {
  const cities = useMemo(() => (values.state ? INDIA_STATES[values.state] ?? [] : []), [values.state]);

  const handleFile = (f: File | null) => {
    if (f && f.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    onChange({
      imageFile: f,
      imagePreview: f ? URL.createObjectURL(f) : "",
      removeExistingImage: f ? true : values.removeExistingImage,
    });
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        onChange({ coords: { lat: p.coords.latitude, lng: p.coords.longitude } });
        toast.success("Location captured");
      },
      (err) => toast.error(err.message || "Could not get location"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const showImage = values.imagePreview || (values.existingImageUrl && !values.removeExistingImage);
  const imageSrc = values.imagePreview || values.existingImageUrl || "";

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Broken streetlight on Main Road"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">Description *</Label>
        <Textarea
          id="desc"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="विस्तार से बताइए... / Describe the issue..."
          rows={5}
          required
        />
        <p className="text-xs text-muted-foreground">Supports Hindi, Tamil, Telugu, Bengali, Marathi & all Indian languages.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>State *</Label>
          <Select value={values.state} onValueChange={(v) => onChange({ state: v, city: "" })}>
            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {INDIA_STATE_NAMES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>City *</Label>
          <Select value={values.city} onValueChange={(v) => onChange({ city: v })} disabled={!values.state}>
            <SelectTrigger><SelectValue placeholder={values.state ? "Select city" : "Pick state first"} /></SelectTrigger>
            <SelectContent className="max-h-72">
              {cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addr">Street / Landmark</Label>
        <Input
          id="addr"
          value={values.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="e.g. Near City Hospital, MG Road"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Photo (optional)</Label>
        <label className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition">
          <div className="p-2 rounded-lg bg-accent text-accent-foreground"><Upload className="h-4 w-4" /></div>
          <div className="text-sm flex-1">
            <div className="font-medium">{values.imageFile ? values.imageFile.name : "Click to upload an image"}</div>
            <div className="text-xs text-muted-foreground">PNG, JPG up to 5MB</div>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
        </label>
        {showImage && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border w-40 h-40 relative group">
            <img src={imageSrc} alt="preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange({ imageFile: null, imagePreview: "", removeExistingImage: true })}
              className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Pin Location (optional)</Label>
          <Button type="button" variant="outline" size="sm" onClick={useMyLocation}>
            <Locate className="h-4 w-4 mr-1.5" /> Use My Location
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Click on the map to drop a pin or use your current location.</p>
        <LocationPicker value={values.coords} onChange={(c) => onChange({ coords: c })} />
        {values.coords && (
          <p className="text-xs text-muted-foreground font-mono">
            📍 {values.coords.lat.toFixed(5)}, {values.coords.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
};

export default ComplaintForm;
