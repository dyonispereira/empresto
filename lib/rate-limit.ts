import {env} from 'cloudflare:workers';
// Fixed-window counter in D1: true while `key` has been hit fewer than `limit` times in the current window.
// Used to stop one account or address from spending the Asaas API quota or guessing passwords.
export async function allow(key:string,limit:number,windowSeconds:number){
 const now=Date.now(),reset=new Date(now+windowSeconds*1000).toISOString();
 const row=await env.DB!.prepare(`INSERT INTO rate_limits(key,count,reset_at) VALUES(?1,1,?2) ON CONFLICT(key) DO UPDATE SET
  count=CASE WHEN rate_limits.reset_at<=?3 THEN 1 ELSE rate_limits.count+1 END,reset_at=CASE WHEN rate_limits.reset_at<=?3 THEN ?2 ELSE rate_limits.reset_at END RETURNING count`).bind(key,reset,new Date(now).toISOString()).first<{count:number}>();
 return (row?.count??0)<=limit;
}
// Read-only check: true when `key` already used up its `limit` in the current window (count only failures with allow()).
export async function exhausted(key:string,limit:number){const row=await env.DB!.prepare('SELECT count,reset_at FROM rate_limits WHERE key=?').bind(key).first<{count:number;reset_at:string}>();return !!row&&row.count>=limit&&row.reset_at>new Date().toISOString();}
// Address of the visitor as seen by Cloudflare; requests without it share one bucket.
export const clientIp=(req:Request)=>req.headers.get('cf-connecting-ip')||'unknown';
// Old windows are useless once expired; trimmed now and then so the table stays small.
export async function pruneRateLimits(){await env.DB!.prepare('DELETE FROM rate_limits WHERE reset_at<=?').bind(new Date().toISOString()).run();}
