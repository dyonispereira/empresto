declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
declare namespace Cloudflare {interface Env {ASAAS_API_KEY?:string;ASAAS_ENVIRONMENT?:string;ASAAS_WEBHOOK_TOKEN?:string;BILLING_ENABLED?:string;}}
declare namespace Cloudflare {interface Env {EMPRESTO_ADMIN_EMAIL?:string;SUPPORT_EMAIL?:string;REQUIRE_SUBSCRIPTION?:string;}}
declare namespace Cloudflare {interface Env {ZAPI_PARTNER_TOKEN?:string;ZAPI_CLIENT_TOKEN?:string;ZAPI_INSTANCE_ID?:string;ZAPI_INSTANCE_TOKEN?:string;}}
declare namespace Cloudflare {interface Env {DATA_ENCRYPTION_KEY?:string;}}
