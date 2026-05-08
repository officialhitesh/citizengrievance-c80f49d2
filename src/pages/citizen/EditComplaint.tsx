import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Lock } from "lucide-react";
import CitizenLayout from "@/components/CitizenLayout";
import ComplaintForm, { ComplaintFormValues } from "@/components/ComplaintForm";

const empty: ComplaintFormValues = {
  title: "", description: "", state: "", city: "", address: "",
  imageFile: null, imagePreview: "", existingImageUrl: null, removeExistingImage: false, coords: null,
};

const extractStoragePath = (publicUrl: string | null): string | null => {
  if (!publicUrl) return null;
  const marker = "/complaint-images/";
  const i = publicUrl.indexOf(marker);
  return i >= 0 ? publicUrl.substring(i + marker.length) : null;
};

const EditComplaint = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<ComplaintFormValues>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    (async () => {
      const { data, error } = await supabase
        .from("complaints").select("*").eq("complaint_id", id).maybeSingle();
      if (error || !data) { toast.error(error?.message ?? "Not found"); navigate("/citizen/my-complaints"); return; }
      if (data.user_id !== user.id) { toast.error("Access denied"); navigate("/citizen/my-complaints"); return; }
      if (data.status !== "Pending") { setBlocked(data.status); setLoading(false); return; }
      setValues({
        title: data.title,
        description: data.description,
        state: (data as any).state ?? "",
        city: (data as any).city ?? "",
        address: (data as any).address ?? "",
        imageFile: null,
        imagePreview: "",
        existingImageUrl: data.image_url,
        removeExistingImage: false,
        coords: data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null,
      });
      setOriginalImageUrl(data.image_url);
      setLoading(false);
    })();
  }, [id, user, navigate]);

  const update = (patch: Partial<ComplaintFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (!values.title.trim() || !values.description.trim()) return toast.error("Title and description required");
    if (!values.state || !values.city) return toast.error("Please select state and city");

    setSaving(true);
    try {
      let imageUrl: string | null = values.removeExistingImage ? null : originalImageUrl;

      if (values.imageFile) {
        const ext = values.imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("complaint-images")
          .upload(path, values.imageFile, { contentType: values.imageFile.type });
        if (upErr) { toast.error("Image upload failed: " + upErr.message); return; }
        imageUrl = supabase.storage.from("complaint-images").getPublicUrl(path).data.publicUrl;
      }

      // Delete old image if replaced or removed
      if (originalImageUrl && originalImageUrl !== imageUrl) {
        const oldPath = extractStoragePath(originalImageUrl);
        if (oldPath) await supabase.storage.from("complaint-images").remove([oldPath]);
      }

      const { error } = await supabase.from("complaints").update({
        title: values.title.trim(),
        description: values.description.trim(),
        state: values.state,
        city: values.city,
        address: values.address.trim() || null,
        image_url: imageUrl,
        latitude: values.coords?.lat ?? null,
        longitude: values.coords?.lng ?? null,
      }).eq("complaint_id", id);

      if (error) { toast.error(error.message); return; }

      // Re-classify after edit (fire-and-forget)
      supabase.functions.invoke("classify-complaint", { body: { complaintId: id } })
        .catch((err) => console.warn("classify-complaint failed:", err));

      toast.success("Complaint updated");
      navigate("/citizen/my-complaints");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <CitizenLayout>
        <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </CitizenLayout>
    );
  }

  if (blocked) {
    return (
      <CitizenLayout>
        <div className="container py-16 max-w-xl">
          <Card className="p-8 text-center border-border/60">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center mb-3">
              <Lock className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">This complaint can no longer be edited.</h2>
            <p className="text-muted-foreground mt-1">Status is "{blocked}". Editing is only allowed while pending.</p>
            <Button className="mt-5" onClick={() => navigate("/citizen/my-complaints")}>Back to list</Button>
          </Card>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      <div className="container py-8 sm:py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Edit Complaint</h1>
          <p className="text-muted-foreground mt-1">Update details below and save your changes.</p>
        </div>

        <Card className="p-6 sm:p-8 shadow-[var(--shadow-card)] border-border/60">
          <form onSubmit={handleSave}>
            <ComplaintForm values={values} onChange={update} />
            <div className="flex gap-3 pt-8">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/citizen/my-complaints")}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </CitizenLayout>
  );
};

export default EditComplaint;
