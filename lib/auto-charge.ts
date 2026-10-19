import {env} from 'cloudflare:workers';
import {type Portfolio,today,balance} from './model';
import {pixPayload,chargeMessage} from './pix';
import {type ZapiConnection,sendWhatsApp} from './whatsapp';
type Row={enabled:number;zapi_instance:string|null;zapi_token:string|null;zapi_client_token:string|null};
const connectionOf=(r:Row|null):ZapiConnection|null=>r?.zapi_instance&&r.zapi_token?{instanceId:r.zapi_instance,token:r.zapi_token,clientToken:r.zapi_client_token}:null;
export async function autoChargeSettings(owner:string){const r=await env.DB!.prepare('SELECT enabled,zapi_instance,zapi_token,zapi_client_token FROM auto_charge WHERE user_id=?').bind(owner).first<Row>();return {enabled:!!r?.enabled,connection:connectionOf(r)};}
export async function setAutoCharge(owner:string,enabled:boolean){await env.DB!.prepare('INSERT INTO auto_charge(user_id,enabled,updated_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET enabled=excluded.enabled,updated_at=excluded.updated_at').bind(owner,enabled?1:0,new Date().toISOString()).run();}
export async function setConnection(owner:string,c:ZapiConnection|null){await env.DB!.prepare('INSERT INTO auto_charge(user_id,enabled,zapi_instance,zapi_token,zapi_client_token,updated_at) VALUES(?,0,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET zapi_instance=excluded.zapi_instance,zapi_token=excluded.zapi_token,zapi_client_token=excluded.zapi_client_token,updated_at=excluded.updated_at'+(c?'':',enabled=0')).bind(owner,c?.instanceId??null,c?.token??null,c?.clientToken??null,new Date().toISOString()).run();}
export async function autoChargeLog(owner:string){const {results}=await env.DB!.prepare('SELECT client,amount,due_date,status,error,sent_at FROM auto_charge_log WHERE owner=? ORDER BY sent_at DESC LIMIT 20').bind(owner).all();return results;}
// Installments due on `date` that are still open, from active clients with a phone.
export function dueOn(data:Portfolio,date=today()){
 const out:{key:string;client:string;phone:string;amount:number;date:string}[]=[];
 for(const l of data.loans){if(balance(l)<=0)continue;const c=data.clients.find(x=>x.id===l.clientId);if(!c?.active||!c.phone)continue;
  for(const p of l.installments)if(p.date===date&&p.paid<p.amount)out.push({key:l.id+':'+p.id+':'+p.date,client:c.name,phone:c.phone,amount:p.amount-p.paid,date:p.date});}
 return out;
}
// Limits that make the sends look like a person, lowering the risk of WhatsApp blocking the user's number.
export const DAILY_LIMIT=40;
const pause=()=>new Promise(r=>setTimeout(r,4000+Math.random()*4000));
// Daily job: for every user who turned it on, sends one WhatsApp per installment due today with their own message and Pix.
// Each installment is sent at most once; failures stay retryable.
export async function runAutoCharges(){
 const {results}=await env.DB!.prepare('SELECT a.user_id AS owner,a.zapi_instance,a.zapi_token,a.zapi_client_token,a.enabled,p.data FROM auto_charge a JOIN portfolios p ON p.owner=a.user_id WHERE a.enabled=1 AND a.zapi_instance IS NOT NULL').all<Row&{owner:string;data:string}>();
 let sent=0,failed=0;
 for(const r of results){
  const conn=connectionOf(r)!;let portfolio:Portfolio;try{portfolio=JSON.parse(r.data)}catch{continue}
  const pix=portfolio.pixSettings;if(!pix?.key)continue;
  for(const item of dueOn(portfolio).slice(0,DAILY_LIMIT)){
   // Claim the installment; one that failed before (e.g. WhatsApp offline) is retried on the next run.
   const claimed=await env.DB!.prepare("INSERT INTO auto_charge_log(owner,item,client,amount,due_date,status,sent_at) VALUES(?,?,?,?,?,'sending',?) ON CONFLICT(owner,item) DO UPDATE SET status='sending',error=NULL,sent_at=excluded.sent_at WHERE auto_charge_log.status='failed'").bind(r.owner,item.key,item.client,item.amount,item.date,new Date().toISOString()).run();
   if(!claimed.meta.changes)continue;
   let status='sent',error:string|null=null;
   if(sent+failed)await pause();
   try{await sendWhatsApp(conn,item.phone,chargeMessage(pix,item.client,item.amount,item.date,pixPayload(pix,item.amount)));sent++;}
   catch(e){status='failed';error=(e as Error).message.slice(0,300);failed++;}
   await env.DB!.prepare('UPDATE auto_charge_log SET status=?,error=? WHERE owner=? AND item=?').bind(status,error,r.owner,item.key).run();
  }
 }
 return {users:results.length,sent,failed};
}
