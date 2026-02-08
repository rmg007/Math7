// Follows standard Supabase Edge Function pattern
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

serve(async (req) => {
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
    console.error(`Error processing alert: ${error.message}`);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
})
