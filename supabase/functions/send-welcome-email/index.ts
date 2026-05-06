// Sends a welcome email via Resend gateway after a user verifies their account.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const { email, name } = await req.json();
    if (!email || typeof email !== "string") throw new Error("email is required");
    const safeName = (typeof name === "string" ? name : "").slice(0, 80) || "there";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
        <h1 style="color:#1d4ed8;margin:0 0 12px">Welcome, ${safeName}!</h1>
        <p>Your Citizen Grievance account is now active.</p>
        <p>You can now file complaints, attach photos, mark locations, and track status updates from your dashboard.</p>
        <p style="margin-top:24px;color:#555;font-size:12px">If you didn't create this account, please ignore this email.</p>
      </div>`;

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Citizen Grievance <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Citizen Grievance",
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(data)}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("send-welcome-email error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
