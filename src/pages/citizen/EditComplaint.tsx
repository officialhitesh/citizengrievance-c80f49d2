import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Lock } from "lucide-react";
import CitizenLayout from "@/components/CitizenLayout";
import ComplaintForm, { ComplaintFormValues, Priority } from "@/components/ComplaintForm";

const empty: ComplaintFormValues = {
  title: "", description: "", priority: "", fullName: "", mobile: "", email: "",
  address: "", pincode: "", location: "",
  imageFile: null, imagePreview: "", existingImageUrl: null, removeExistingImage: false,
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
      const d = data as any;
      setValues({
        title: d.title,
        description: d.description,
        priority: (d.priority as Priority) || "",
        fullName: d.full_name ?? "",
        mobile: d.mobile ?? "",
        email: d.email ?? "",
        address: d.address ?? "",
        pincode: d.pincode ?? "",
        location: d.location_text ?? d.city ?? "",
        imageFile: null,
        imagePreview: "",
        existingImageUrl: d.image_url,
        removeExistingImage: false,
      });
      setOriginalImageUrl(d.image_url);
      setLoading(false);
    })();
  }, [id, user, navigate]);

  const update = (patch: Partial<ComplaintFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;
    if (!values.title.trim() || !values.description.trim()) return toast.error("Title and description are required");
    if (!values.priority) return toast.error("Please select a priority");
    if (!values.fullName.trim()) return toast.error("Full name is required");
    if (!/^\d{10}$/.test(values.mobile)) return toast.error("Enter a valid 10-digit mobile number");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return toast.error("Enter a valid email");
    if (!values.address.trim()) return toast.error("Address is required");
    if (!/^\d{6}$/.test(values.pincode)) return toast.error("Enter a valid 6-digit pin code");
    if (!values.location.trim()) return toast.error("Complaint location is required");

    setSaving(true);
    try {
      let imageUrl: string | null = values.removeExistingImage ? null : originalImageUrl;

      if (values.imageFile) {
        const ext = values.imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("complaint-images")
          .upload(path, values.imageFile, { contentType: values.imageFile.type });
        if (upErr) { toast.error("Upload failed: " + upErr.message); return; }
        imageUrl = supabase.storage.from("complaint-images").getPublicUrl(path).data.publicUrl;
      }

      if (originalImageUrl && originalImageUrl !== imageUrl) {
        const oldPath = extractStoragePath(originalImageUrl);
        if (oldPath) await supabase.storage.from("complaint-images").remove([oldPath]);
      }

      const { error } = await supabase.from("complaints").update({
        title: values.title.trim(),
        description: values.description.trim(),
        priority: values.priority,
        full_name: values.fullName.trim(),
        mobile: values.mobile,
        email: values.email.trim(),
        address: values.address.trim(),
        pincode: values.pincode,
        location_text: values.location.trim(),
        image_url: imageUrl,
      }).eq("complaint_id", id);

      if (error) { toast.error(error.message); return; }

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
