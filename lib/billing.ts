import {env} from 'cloudflare:workers';
export type Payment={id:string;status:string;value:number;dueDate:string;invoiceUrl?:string;paymentDate?:string;confirmedDate?:string;subscription?:string;tierPrice?:number;months?:number};
// What the current recurrence was bought for: the monthly tier price it unlocks and how many months each charge covers.
export type Plan={tierPrice:number;cycle:string;months:number};
export const isBillingConfigured=()=>!!env.ASAAS_API_KEY&&env.BILLING_ENABLED==='true';
export async function gateway(path:string,method='GET',body?:unknown){if(!isBillingConfigured())throw Error('Conecte a conta de pagamentos do Emprestô para ativar assinaturas.');const base=env.ASAAS_ENVIRONMENT==='production'?'https://api.asaas.com/v3':'https://api-sandbox.asaas.com/v3';const r=await fetch(base+path,{method,headers:{access_token:env.ASAAS_API_KEY!,'Content-Type':'application/json','User-Agent':'Empresto/1.0'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const j:any=await r.json();if(!r.ok)throw Error(j.errors?.[0]?.description||'O provedor não concluiu a operação. Consulte a assinatura antes de tentar novamente.');return j;}
export function billingStatus(payments:Payment[],providerStatus:string){return providerStatus==='INACTIVE'?'cancelled':paidUntil(payments)>Date.now()?'active':payments.some(p=>p.status==='OVERDUE')?'overdue':'pending';}
export type SubscriptionRow={owner:string;reference:string;customer_id:string|null;subscription_id:string|null;status:string;method:string|null;payments:string;updated_at:string;lock:string|null;plan?:string|null};
export async function row(owner:string){return env.DB!.prepare('SELECT * FROM subscriptions WHERE owner=?').bind(owner).first<SubscriptionRow>();}
// Paid charges from earlier subscriptions are kept, so switching tiers never erases a month already paid.
export async function sync(row:SubscriptionRow){if(!row.subscription_id)return row;const sub=await gateway('/subscriptions/'+encodeURIComponent(row.subscription_id));const charges=await gateway('/subscriptions/'+encodeURIComponent(row.subscription_id)+'/payments?limit=100');const plan:Plan|null=row.plan?JSON.parse(row.plan):null;const months=plan?.months??CYCLE_MONTHS[sub.cycle]??1;const fresh:Payment[]=(charges.data||[]).map((p:Payment)=>({id:p.id,status:p.status,value:p.value,dueDate:p.dueDate,invoiceUrl:p.invoiceUrl,paymentDate:p.paymentDate,confirmedDate:p.confirmedDate,subscription:row.subscription_id!,tierPrice:plan?.tierPrice??Math.round(p.value*100/months),months}));const kept=(JSON.parse(row.payments) as Payment[]).filter(p=>p.subscription&&p.subscription!==row.subscription_id&&PAID.includes(p.status));const payments=[...fresh,...kept];const status=billingStatus(fresh,sub.status);await env.DB!.prepare('UPDATE subscriptions SET status=?,payments=?,updated_at=? WHERE owner=?').bind(status,JSON.stringify(payments),new Date().toISOString(),row.owner).run();return {...row,status,payments:JSON.stringify(payments)};}
export const PAID=['RECEIVED','CONFIRMED','RECEIVED_IN_CASH'];
// Months each Asaas cycle covers; rows created before the plan column fall back to the cycle Asaas reports.
const CYCLE_MONTHS:Record<string,number>={MONTHLY:1,QUARTERLY:3,SEMIANNUALLY:6,YEARLY:12};
// Re-reads one stored charge from Asaas, so a refund or chargeback on an ended subscription also removes the access it gave.
export async function refreshPayment(row:SubscriptionRow,paymentId:string){
 const payments=JSON.parse(row.payments) as Payment[];const i=payments.findIndex(p=>p.id===paymentId);if(i<0)return row;
 const p=await gateway('/payments/'+encodeURIComponent(paymentId));
 payments[i]={...payments[i],status:p.deleted?'DELETED':p.status,value:p.value??payments[i].value,paymentDate:p.paymentDate??undefined,confirmedDate:p.confirmedDate??undefined};
 await env.DB!.prepare('UPDATE subscriptions SET payments=?,updated_at=? WHERE owner=?').bind(JSON.stringify(payments),new Date().toISOString(),row.owner).run();
 return {...row,payments:JSON.stringify(payments)};
}
// A paid charge covers its plan's months (one by default) from its latest date (due, paid or confirmed).
export function coveredUntil(p:Payment){const anchor=[p.dueDate,p.paymentDate,p.confirmedDate].filter(Boolean).sort().at(-1)!;const d=new Date(anchor.slice(0,10)+'T12:00:00Z'),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+(p.months||1));const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.getTime();}
export function paidUntil(payments:Payment[]){return payments.filter(p=>PAID.includes(p.status)).reduce((latest,p)=>Math.max(latest,coveredUntil(p)),0);}
// Highest monthly tier price (in cents) among charges still covering today; it decides how many clients are unlocked.
export function paidValue(payments:Payment[]){const now=Date.now();return payments.filter(p=>PAID.includes(p.status)&&coveredUntil(p)>now).reduce((max,p)=>Math.max(max,p.tierPrice??Math.round(p.value*100)),0);}
// Check digits of a CPF (11 digits) or CNPJ (14 digits), so Asaas customers are not created with made-up documents.
export function validDocument(d:string){if(/^(\d)\1+$/.test(d))return false;const check=(digits:string,weights:number[])=>{const r=weights.reduce((s,w,i)=>s+Number(digits[i])*w,0)%11;return r<2?0:11-r;};if(d.length===11){const w=(n:number)=>Array.from({length:n},(_,i)=>n+1-i);return check(d,w(9))===Number(d[9])&&check(d,w(10))===Number(d[10]);}if(d.length===14){const w1=[5,4,3,2,9,8,7,6,5,4,3,2],w2=[6,...w1];return check(d,w1)===Number(d[12])&&check(d,w2)===Number(d[13]);}return false;}
export function admin(email:string){return !!env.EMPRESTO_ADMIN_EMAIL&&email.trim().toLowerCase()===env.EMPRESTO_ADMIN_EMAIL.trim().toLowerCase();}
export async function access(owner:string,email:string){
 if(admin(email))return {allowed:true,admin:true,until:null,paidCents:0};
 if(env.REQUIRE_SUBSCRIPTION!=='true')return {allowed:true,admin:false,until:null,paidCents:0};
 if(!isBillingConfigured()||env.ASAAS_ENVIRONMENT!=='production')return {allowed:false,admin:false,until:null,paidCents:0};
 let current=await row(owner);if(current?.subscription_id&&current.status!=='cancelled'&&Date.now()-new Date(current.updated_at).getTime()>300000)current=await sync(current);
 const payments:Payment[]=current?JSON.parse(current.payments):[];const until=paidUntil(payments);return {allowed:until>Date.now(),admin:false,until:until?new Date(until).toISOString():null,paidCents:paidValue(payments)};
}
