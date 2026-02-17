// Follows standard Supabase Edge Function pattern
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface ErrorRecord {
  id: string;
  platform: string;
  error_type: string;
  error_message: string;
  extra_context: {
    severity?: string;
    alert_needed?: string;
    [key: string]: any;
  };
}

export async function criticalAlertHandler(req: Request): Promise<Response> {
  // --- HADES SECURITY PATCH: START ---
  const webhookSecret = Deno.env.get("ERROR_WEBHOOK_SECRET");
  const incomingSecret = req.headers.get("x-webhook-secret");

  if (!webhookSecret) {
    console.error("ERROR_WEBHOOK_SECRET is not set in environment. Blocking all requests for safety.");
    return new Response(JSON.stringify({ error: "Configuration error" }), { status: 500 });
  }

  if (incomingSecret !== webhookSecret) {
    console.warn("Unauthorized critical-alert attempt detected.");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  // --- HADES SECURITY PATCH: END ---

  try {
    const payload = await req.json();
    const { record, type } = payload as { record: ErrorRecord, type: string };

    // Check if it's a critical error
    const isCritical = 
      record.error_type?.toLowerCase().includes("critical") || 
      record.extra_context?.severity === "critical" ||
      record.extra_context?.alert_needed === "true";

    if (type === "INSERT" && isCritical) {
      console.log(`🚨 CRITICAL ERROR DETECTED: [${record.platform}] ${record.error_type}`);
      console.log(`Message: ${record.error_message}`);
      console.log(`Context: ${JSON.stringify(record.extra_context)}`);
      
      // TODO: Integrate with Discord/Slack/Resend here
      // For now, we log it in the Edge Function logs which are monitored
      
      return new Response(JSON.stringify({ message: "Alert processed", id: record.id }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ message: "No alert needed" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error processing alert: ${message}`);
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
}

// Start the server only if run as main
if (import.meta.main) {
  serve(criticalAlertHandler)
}
