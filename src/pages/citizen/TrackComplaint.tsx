import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Loader2, MapPin, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import CitizenLayout from "@/components/CitizenLayout";

type Status = "Pending" | "In Progress" | "Resolved";

const STATUS_STYLES: Record<Status, string> = {
  "Pending": "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  "In Progress": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  "Resolved": "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
};

const PRIORITY_STYLES: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  High: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  Critical: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const TrackComplaint = () => {
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = trackingId.trim().toUpperCase();
    if (!id) return toast.error("Enter a tracking ID");
    setLoading(true);
    setNotFound(false);
    setResult(null);
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("tracking_id", id)
      .maybeSingle();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!data) { setNotFound(true); return; }
    setResult(data);
  };

  return (
    <CitizenLayout>
      <div className="container py-8 sm:py-10 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Track Your Complaint</h1>
          <p className="text-muted-foreground mt-1">Enter the tracking ID you received after submission.</p>
        </div>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border/60">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="e.g. CG-A1B2C3D4"
              className="font-mono uppercase"
            />
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1.5" /> Track</>}
            </Button>
          </form>
        </Card>

        {notFound && (
          <Card className="mt-6 p-6 text-center border-dashed border-border/80 bg-card/50">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-semibold">No complaint found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Check the ID and try again. You can only track complaints filed under your account.
            </p>
          </Card>
        )}

        {result && (
          <Card className="mt-6 p-6 shadow-[var(--shadow-card)] border-border/60">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground font-mono">{result.tracking_id}</div>
                <h2 className="text-xl font-bold mt-0.5">{result.title}</h2>
              </div>
              <Badge variant="outline" className={cn("font-medium", STATUS_STYLES[result.status as Status])}>
                {result.status}
              </Badge>
            </div>

            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{result.description}</p>

            <div className="grid sm:grid-cols-2 gap-3 mt-5 text-sm">
              {result.priority && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Priority</div>
                  <Badge variant="outline" className={cn("font-medium", PRIORITY_STYLES[result.priority] || "")}>
                    {result.priority}
                  </Badge>
                </div>
              )}
              {result.department && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Department</div>
                  <div className="font-medium">{result.department}</div>
                </div>
              )}
              {(result.location_text || result.address) && (
                <div className="sm:col-span-2 inline-flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{[result.address, result.location_text, result.pincode].filter(Boolean).join(", ")}</span>
                </div>
              )}
              <div className="sm:col-span-2 inline-flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Filed on {new Date(result.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
            </div>

            {result.image_url && (
              <img src={result.image_url} alt="Complaint" className="mt-4 w-full max-h-72 object-cover rounded-lg border border-border" />
            )}

            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/citizen/my-complaints")}>
                See All My Complaints
              </Button>
            </div>
          </Card>
        )}
      </div>
    </CitizenLayout>
  );
};

export default TrackComplaint;
