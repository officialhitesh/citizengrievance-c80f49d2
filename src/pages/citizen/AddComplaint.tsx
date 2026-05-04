import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin, Upload, ImageIcon, Locate } from "lucide-react";
import LocationPicker from "@/components/LocationPicker";

const AddComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleFile = (f: File | null) => {
    setImageFile(f);
    if (f) setImagePreview(URL.createObjectURL(f));
    else setImagePreview("");
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setCoords({ lat: p.coords.latitude, lng: p.coords.longitude });
        toast.success("Location captured");
        setLocating(false);
      },
      (err) => {
        toast.error(err.message || "Could not get location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !description.trim()) return toast.error("Title and description required");

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("complaint-images")
          .upload(path, imageFile, { contentType: imageFile.type });
        if (upErr) { toast.error("Image upload failed: " + upErr.message); return; }
        const { data } = supabase.storage.from("complaint-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from("complaints").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        image_url: imageUrl,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        status: "Pending",
      });
      if (error) { toast.error(error.message); return; }

      toast.success("Complaint filed successfully");
      navigate("/citizen/my-complaints");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-20">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/citizen-dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Link>
          <div className="font-semibold">File a Grievance</div>
        </div>
      </header>

      <main className="container py-10 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">New Complaint</h1>
          <p className="text-muted-foreground mt-1">Provide clear details so authorities can act faster.</p>
        </div>

        <Card className="p-6 sm:p-8 shadow-[var(--shadow-card)] border-border/60">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Broken streetlight on Main Road" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc">Description *</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="विस्तार से बताइए... / Describe the issue..."
                rows={6}
                required
                lang="auto"
              />
              <p className="text-xs text-muted-foreground">Supports Hindi, Tamil, Telugu, Bengali, Marathi & all Indian languages.</p>
            </div>

            <div className="space-y-1.5">
              <Label>Photo (optional)</Label>
              <label className="flex items-center gap-3 p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition">
                <div className="p-2 rounded-lg bg-accent text-accent-foreground"><Upload className="h-4 w-4" /></div>
                <div className="text-sm">
                  <div className="font-medium">{imageFile ? imageFile.name : "Click to upload an image"}</div>
                  <div className="text-xs text-muted-foreground">PNG, JPG up to ~5MB</div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
              </label>
              {imagePreview && (
                <div className="mt-2 rounded-lg overflow-hidden border border-border w-40 h-40 relative">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Location (optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
                  {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Locate className="h-4 w-4 mr-1.5" /> Use My Location</>}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Or click on the map to drop a pin.</p>
              <LocationPicker value={coords} onChange={setCoords} />
              {coords && (
                <p className="text-xs text-muted-foreground font-mono">
                  📍 {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/citizen-dashboard")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ImageIcon className="h-4 w-4 mr-2" /> Submit Complaint</>}
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default AddComplaint;
