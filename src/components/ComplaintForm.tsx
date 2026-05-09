import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export interface ComplaintFormValues {
  title: string;
  description: string;
  priority: Priority | "";
  fullName: string;
  mobile: string;
  email: string;
  address: string;
  pincode: string;
  location: string;
  imageFile: File | null;
  imagePreview: string;
  existingImageUrl: string | null;
  removeExistingImage: boolean;
}

interface Props {
  values: ComplaintFormValues;
  onChange: (patch: Partial<ComplaintFormValues>) => void;
}

const PRIORITY_OPTIONS: Priority[] = ["Low", "Medium", "High", "Critical"];

const ComplaintForm = ({ values, onChange }: Props) => {
  const handleFile = (f: File | null) => {
    if (f && f.size > 5 * 1024 * 1024) return toast.error("File must be under 5MB");
    onChange({
      imageFile: f,
      imagePreview: f && f.type.startsWith("image/") ? URL.createObjectURL(f) : "",
      removeExistingImage: f ? true : values.removeExistingImage,
    });
  };

  const showImage = values.imagePreview || (values.existingImageUrl && !values.removeExistingImage);
  const imageSrc = values.imagePreview || values.existingImageUrl || "";

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="title">Complaint Title *</Label>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="e.g. Broken streetlight on Main Road"
          maxLength={120}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="desc">Complaint Description *</Label>
        <Textarea
          id="desc"
          value={values.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe the issue in detail..."
          rows={5}
          maxLength={2000}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Priority Level *</Label>
        <Select value={values.priority} onValueChange={(v) => onChange({ priority: v as Priority })}>
          <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={values.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            placeholder="Your full name"
            maxLength={100}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mobile">Mobile Number *</Label>
          <Input
            id="mobile"
            type="tel"
            value={values.mobile}
            onChange={(e) => onChange({ mobile: e.target.value.replace(/[^\d]/g, "").slice(0, 10) })}
            placeholder="10-digit mobile"
            inputMode="numeric"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email Address *</Label>
        <Input
          id="email"
          type="email"
          value={values.email}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="you@example.com"
          maxLength={255}
          required
        />
      </div>

      <div className="grid sm:grid-cols-[1fr_180px] gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="addr">Address *</Label>
          <Input
            id="addr"
            value={values.address}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="House no, street, area"
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pin">Pin Code *</Label>
          <Input
            id="pin"
            value={values.pincode}
            onChange={(e) => onChange({ pincode: e.target.value.replace(/[^\d]/g, "").slice(0, 6) })}
            placeholder="6-digit"
            inputMode="numeric"
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="loc">Complaint Location *</Label>
        <Input
          id="loc"
          value={values.location}
          onChange={(e) => onChange({ location: e.target.value })}
          placeholder="City / area where the issue is"
          maxLength={150}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label>Upload Image / Document (optional)</Label>
        <label className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition">
          <div className="p-2 rounded-lg bg-accent text-accent-foreground"><Upload className="h-4 w-4" /></div>
          <div className="text-sm flex-1">
            <div className="font-medium">{values.imageFile ? values.imageFile.name : "Click to upload"}</div>
            <div className="text-xs text-muted-foreground">Image or PDF up to 5MB</div>
          </div>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
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
    </div>
  );
};

export default ComplaintForm;
