import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { ensureSchema } from "../lib/schema-setup";
import { runAutoCharges } from "../lib/auto-charge";
import { pruneRateLimits } from "../lib/rate-limit";

// Sent on every response: no framing (clickjacking), HTTPS only, no MIME sniffing, and no referrer leaking to other sites.
// The CSP leaves scripts and styles alone because the framework inlines both; it only blocks framing, plugins and foreign form posts.
const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "Permissions-Policy": "camera=(self), geolocation=(self), microphone=(), payment=()",
};

function withSecurityHeaders(response: Response) {
  if (response.status === 101) return response;
  const secured = new Response(response.body, response);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) if (!secured.headers.has(name)) secured.headers.set(name, value);
  return secured;
}

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    await ensureSchema(env.DB);
    const response = await runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
    return withSecurityHeaders(response);
  },
  // Cron (wrangler.jsonc): daily WhatsApp reminders for installments due today.
  async scheduled(_controller: ScheduledController, env: Cloudflare.Env) {
    await ensureSchema(env.DB);
    await pruneRateLimits().catch(() => null);
    try {
      console.log("auto-charge", JSON.stringify(await runAutoCharges()));
    } catch (e) {
      console.error("auto-charge failed", e instanceof Error ? e.stack : e);
      throw e;
    }
  },
};
