import {env} from 'cloudflare:workers';
import {admin,paidUntil,type Payment} from './billing';
import {NO_EXPIRY} from './plan';
import {getCustomPrices} from './pricing';
import {walletSummary,balance,overdue,type Portfolio} from './model';
type Row={id:string;name:string;email:string;created_at:string;data:string|null;clients:number|null;status:string|null;payments:string|null;courtesy:string|null;last_seen:string|null;active_seconds:number|null};
export async function listSubscribers(){
 const {results}=await env.DB!.prepare(`SELECT u.id,u.name,u.email,u.created_at,p.data,
  json_array_length(json_extract(p.data,'$.clients')) AS clients,s.status,s.payments,c.until AS courtesy,a.last_seen,a.active_seconds
  FROM users u LEFT JOIN portfolios p ON p.owner=u.id LEFT JOIN subscriptions s ON s.owner=u.id LEFT JOIN courtesies c ON c.user_id=u.id LEFT JOIN activity a ON a.user_id=u.id
  ORDER BY u.created_at DESC LIMIT 500`).all<Row>();
 const now=Date.now(),prices=await getCustomPrices();
 return results.map(r=>{const paid=r.payments?paidUntil(JSON.parse(r.payments) as Payment[]):0;const courtesy=r.courtesy&&new Date(r.courtesy).getTime()>now?r.courtesy:null;
  const charges=r.payments?(JSON.parse(r.payments) as Payment[]).map(p=>({id:p.id,value:Math.round(p.value*100),status:p.status,dueDate:p.dueDate,paidDate:p.confirmedDate||p.paymentDate||null,invoiceUrl:p.invoiceUrl||null})):[];
  return {id:r.id,name:r.name,email:r.email,createdAt:r.created_at,clients:r.clients??0,charges,finance:finance(r.data),admin:admin(r.email),paidUntil:paid>now?new Date(paid).toISOString():null,subscription:r.status,courtesyUntil:courtesy,courtesyForever:courtesy===NO_EXPIRY,customPrice:prices.get(r.id)??null,lastSeen:r.last_seen,activeSeconds:r.active_seconds??0,online:!!r.last_seen&&now-new Date(r.last_seen).getTime()<ONLINE_MS};});
}
// The app pings every minute while it is open on screen; a gap above PING_GAP_S starts a new visit, so idle time is not counted.
const PING_GAP_S=150,ONLINE_MS=150_000;
export async function recordActivity(userId:string){
 const now=new Date().toISOString();
 await env.DB!.prepare(`INSERT INTO activity(user_id,last_seen,active_seconds) VALUES(?1,?2,0) ON CONFLICT(user_id) DO UPDATE SET
  active_seconds=active_seconds+CASE WHEN (julianday(?2)-julianday(last_seen))*86400<=${PING_GAP_S} THEN MAX(0,CAST((julianday(?2)-julianday(last_seen))*86400 AS INTEGER)) ELSE 0 END,last_seen=?2`).bind(userId,now).run();
}
export async function setCourtesy(userId:string,days:number|null,note:string){
 const exists=await env.DB!.prepare('SELECT id FROM users WHERE id=?').bind(userId).first();if(!exists)throw Error('Assinante não encontrado.');
 if(days===0){await env.DB!.prepare('DELETE FROM courtesies WHERE user_id=?').bind(userId).run();return;}
 const until=days===null?NO_EXPIRY:new Date(Date.now()+days*864e5).toISOString();
 await env.DB!.prepare('INSERT INTO courtesies(user_id,until,note,granted_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET until=excluded.until,note=excluded.note,granted_at=excluded.granted_at').bind(userId,until,note.slice(0,200)||null,new Date().toISOString()).run();
}
// Totals in cents for the admin overview; null when the account has no wallet yet.
function finance(raw:string|null){
 if(!raw)return null;
 try{const d=JSON.parse(raw) as Portfolio;const w=walletSummary(d);const open=d.loans.filter(l=>balance(l)>0);
  return {configured:w.configured,funded:w.funded,lent:w.principalOpen,available:w.available,receivable:open.reduce((s,l)=>s+balance(l),0),overdue:open.reduce((s,l)=>s+overdue(l),0),receivedInterest:w.receivedInterest,loans:d.loans.length,openLoans:open.length};
 }catch{return null}
}
