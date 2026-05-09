import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Send, Copy, CheckCircle2 } from "lucide-react";
import CitizenLayout from "@/components/CitizenLayout";
import ComplaintForm, { ComplaintFormValues } from "@/components/ComplaintForm";

const initial: ComplaintFormValues = {
  title: "",
  description: "",
  priority: "",
  fullName: "",
  mobile: "",
  email: "",
  address: "",
  pincode: "",
  location: "",
  imageFile: null,
  imagePreview: "",
  existingImageUrl: null,
  removeExistingImage: false,
};

const AddComplaint = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState<ComplaintFormValues>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Prefill name + email from profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("name,email").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setValues((v) => ({
          ...v,
          fullName: v.fullName || data.name || "",
          email: v.email || data.email || user.email || "",
        }));
      });
  }, [user]);

  const update = (patch: Partial<ComplaintFormValues>) => setValues((v) => ({ ...v, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!values.title.trim() || !values.description.trim()) return toast.error("Title and description are required");
    if (!values.priority) return toast.error("Please select a priority");
    if (!values.fullName.trim()) return toast.error("Full name is required");
    if (!/^\d{10}$/.test(values.mobile)) return toast.error("Enter a valid 10-digit mobile number");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return toast.error("Enter a valid email");
    if (!values.address.trim()) return toast.error("Address is required");
    if (!/^\d{6}$/.test(values.pincode)) return toast.error("Enter a valid 6-digit pin code");
    if (!values.location.trim()) return toast.error("Complaint location is required");

    setSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (values.imageFile) {
        const ext = values.imageFile.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("complaint-images")
          .upload(path, values.imageFile, { contentType: values.imageFile.type });
        if (upErr) { toast.error("Upload failed: " + upErr.message); return; }
        imageUrl = supabase.storage.from("complaint-images").getPublicUrl(path).data.publicUrl;
      }

      const { data: inserted, error } = await supabase.from("complaints").insert({
        user_id: user.id,
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
        status: "Pending",
      }).select("complaint_id, tracking_id").maybeSingle();
      if (error) { toast.error(error.message); return; }

      if (inserted?.complaint_id) {
        supabase.functions.invoke("classify-complaint", {
          body: { complaintId: inserted.complaint_id },
        }).catch((err) => console.warn("classify-complaint failed:", err));
      }

      setTrackingId(inserted?.tracking_id ?? null);
    } finally {
      setSubmitting(false);
    }
  };

  const copyTracking = async () => {
    if (!trackingId) return;
    await navigator.clipboard.writeText(trackingId);
    setCopied(true);
    toast.success("Tracking ID copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <CitizenLayout>
      <div className="container py-8 sm:py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">File a New Grievance</h1>
          <p className="text-muted-foreground mt-1">Fill in the details below — you'll receive a tracking ID after submission.</p>
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

      <Dialog open={!!trackingId} onOpenChange={(o) => { if (!o) navigate("/citizen/my-complaints"); }}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full bg-green-500/15 text-green-600 dark:text-green-400 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center">Complaint submitted!</DialogTitle>
            <DialogDescription className="text-center">
              Save this tracking ID to follow your complaint's progress.
            </DialogDescription>
          </DialogHeader>
          <div className="my-2 p-4 rounded-lg border border-border bg-muted/40 flex items-center justify-between gap-3">
            <code className="text-xl font-bold tracking-wider">{trackingId}</code>
            <Button size="sm" variant="outline" onClick={copyTracking}>
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button
              className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
              onClick={() => navigate("/citizen/my-complaints")}
            >
              View My Complaints
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CitizenLayout>
  );
};

export default AddComplaint;
