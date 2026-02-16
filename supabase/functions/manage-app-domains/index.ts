import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CLOUDFLARE_ACCOUNT_ID = "1ad655f025b0db1974614aac7ebec10a"
const CLOUDFLARE_PROJECT_NAME = "questerix-student"
const BASE_DOMAIN = "questerix.com"

interface AppRecord {
  subdomain: string;
  [key: string]: any;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: AppRecord;
  old_record?: AppRecord;
}

async function handleDomainChange(req: Request) {
  try {
    const webhookSecret = Deno.env.get("DOMAIN_WEBHOOK_SECRET");
    const incomingSecret = req.headers.get("x-webhook-secret");

    console.log(`Checking secrets: webhookSecret set? ${!!webhookSecret}, incomingSecret set? ${!!incomingSecret}`);

    if (webhookSecret && incomingSecret !== webhookSecret) {
      console.warn("Secret mismatch!");
      return new Response("Unauthorized", { status: 401 });
    }

    const apiToken = Deno.env.get("CLOUDFLARE_API_TOKEN");
    if (!apiToken) {
      throw new Error("CLOUDFLARE_API_TOKEN is not set");
    }

    const payload: WebhookPayload = await req.json();
    const { type, record, old_record } = payload;

    console.log(`Processing ${type} for subdomain: ${record?.subdomain || old_record?.subdomain}`);

    if (type === 'INSERT' && record) {
      await addDomain(record.subdomain, apiToken);
    } 
    else if (type === 'DELETE') {
      const subdomainToDelete = record?.subdomain || old_record?.subdomain;
      if (subdomainToDelete) {
        await deleteDomain(subdomainToDelete, apiToken);
      } else {
        console.warn("Delete triggered but no subdomain found in record or old_record.");
      }
    } 
    else if (type === 'UPDATE' && old_record) {
      if (record.subdomain !== old_record.subdomain) {
        console.log(`Subdomain changed from ${old_record.subdomain} to ${record.subdomain}`);
        // Delete old, add new
        await deleteDomain(old_record.subdomain, apiToken);
        await addDomain(record.subdomain, apiToken);
      } else {
        console.log("Subdomain did not change, skipping Cloudflare update.");
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error managing Cloudflare domain:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
}

async function addDomain(subdomain: string, token: string) {
  const fullDomain = `${subdomain}.${BASE_DOMAIN}`;
  console.log(`Adding domain: ${fullDomain}`);

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CLOUDFLARE_PROJECT_NAME}/domains`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: fullDomain }),
  });

  if (!response.ok) {
    const error = await response.json();
    // 10045 is "domain already exists", we can ignore that
    if (error.errors?.[0]?.code === 10045) {
      console.log(`Domain ${fullDomain} already exists in project.`);
      return;
    }
    throw new Error(`Cloudflare API error (Add): ${JSON.stringify(error)}`);
  }
  console.log(`Successfully added ${fullDomain}`);
}

async function deleteDomain(subdomain: string, token: string) {
  const fullDomain = `${subdomain}.${BASE_DOMAIN}`;
  console.log(`Deleting domain: ${fullDomain}`);

  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${CLOUDFLARE_PROJECT_NAME}/domains/${fullDomain}`;
  
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    // 10046 is "domain does not exist", we can ignore that
    if (error.errors?.[0]?.code === 10046) {
      console.log(`Domain ${fullDomain} not found in project, skipping delete.`);
      return;
    }
    throw new Error(`Cloudflare API error (Delete): ${JSON.stringify(error)}`);
  }
  console.log(`Successfully deleted ${fullDomain}`);
}

serve(handleDomainChange)
