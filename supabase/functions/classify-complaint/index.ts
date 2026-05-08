import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEPARTMENTS = [
  "Sanitation",
  "Roads",
  "Water",
  "Electricity",
  "Public Safety",
  "Health",
  "Other",
];
const URGENCIES = ["Low", "Medium", "High", "Critical"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { complaintId } = await req.json();
    if (!complaintId) {
      return new Response(JSON.stringify({ error: "complaintId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: complaint, error: fetchErr } = await supabase
      .from("complaints")
      .select("complaint_id, title, description, city, state, address")
      .eq("complaint_id", complaintId)
      .maybeSingle();

    if (fetchErr || !complaint) {
      return new Response(JSON.stringify({ error: "Complaint not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a municipal grievance classifier. Given a citizen complaint, classify it into:
- department: one of [${DEPARTMENTS.join(", ")}]
- urgency: one of [${URGENCIES.join(", ")}]

Urgency guide:
- Critical: immediate threat to life, safety, large-scale outage, hazardous incident
- High: significant disruption, health risk, blocking essential service
- Medium: moderate inconvenience, partial service issue
- Low: cosmetic, minor, informational

Return ONLY the classification via the provided tool.`;

    const userPrompt = `Title: ${complaint.title}
Description: ${complaint.description}
Location: ${[complaint.address, complaint.city, complaint.state].filter(Boolean).join(", ")}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "classify",
              description: "Return the classification of the complaint.",
              parameters: {
                type: "object",
                properties: {
                  department: { type: "string", enum: DEPARTMENTS },
                  urgency: { type: "string", enum: URGENCIES },
                },
                required: ["department", "urgency"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "classify" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      throw new Error(`AI gateway ${aiRes.status}: ${txt}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No tool call returned");
    const args = JSON.parse(toolCall.function.arguments);

    const department = DEPARTMENTS.includes(args.department) ? args.department : "Other";
    const urgency = URGENCIES.includes(args.urgency) ? args.urgency : "Medium";

    const { error: updErr } = await supabase
      .from("complaints")
      .update({ department, urgency, classified_at: new Date().toISOString() })
      .eq("complaint_id", complaintId);
    if (updErr) throw new Error(`DB update failed: ${updErr.message}`);

    return new Response(JSON.stringify({ success: true, department, urgency }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("classify-complaint error:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
