import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import CitizenLayout from "@/components/CitizenLayout";
import ComplaintForm, { ComplaintFormValues } from "@/components/ComplaintForm";

const initial: ComplaintFormValues = {
  title: "",
  description: "",
  state: "",
  city: "",
  address: "",
  imageFile: null,
  imagePreview: "",
  existingImageUrl: null,
  removeExistingImage: false,
  coords: null,
};

const AddComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<ComplaintFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<ComplaintFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!values.title.trim() || !values.description.trim()) return toast.error("Title and description required");
    if (!values.state || !values.city) return toast.error("Please select state and city");

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (values.imageFile) {
        const ext = values.imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("complaint-images")
          .upload(path, values.imageFile, { contentType: values.imageFile.type });
        if (upErr) { toast.error("Image upload failed: " + upErr.message); return; }
        imageUrl = supabase.storage.from("complaint-images").getPublicUrl(path).data.publicUrl;
      }

      const { error } = await supabase.from("complaints").insert({
        user_id: user.id,
        title: values.title.trim(),
        description: values.description.trim(),
        state: values.state,
        city: values.city,
        address: values.address.trim() || null,
        image_url: imageUrl,
        latitude: values.coords?.lat ?? null,
        longitude: values.coords?.lng ?? null,
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
    <CitizenLayout>
      <div className="container py-8 sm:py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">File a New Grievance</h1>
          <p className="text-muted-foreground mt-1">Provide clear details so authorities can act faster.</p>
        </div>

        <Card className="p-6 sm:p-8 shadow-[var(--shadow-card)] border-border/60">
          <form onSubmit={handleSubmit}>
            <ComplaintForm values={values} onChange={update} />
            <div className="flex gap-3 pt-8">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/citizen-dashboard")}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-elegant)]"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Submit Complaint</>}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </CitizenLayout>
  );
};

export default AddComplaint;
