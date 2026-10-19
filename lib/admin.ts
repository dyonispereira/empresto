import {env} from 'cloudflare:workers';
import {admin,paidUntil,type Payment} from './billing';
import {NO_EXPIRY} from './plan';
type Row={id:string;name:string;email:string;created_at:string;clients:number|null;status:string|null;payments:string|null;courtesy:string|null};
export async function listSubscribers(){
 const {results}=await env.DB!.prepare(`SELECT u.id,u.name,u.email,u.created_at,
  json_array_length(json_extract(p.data,'$.clients')) AS clients,s.status,s.payments,c.until AS courtesy
  FROM users u LEFT JOIN portfolios p ON p.owner=u.id LEFT JOIN subscriptions s ON s.owner=u.id LEFT JOIN courtesies c ON c.user_id=u.id
  ORDER BY u.created_at DESC LIMIT 500`).all<Row>();
 const now=Date.now();
 return results.map(r=>{const paid=r.payments?paidUntil(JSON.parse(r.payments) as Payment[]):0;const courtesy=r.courtesy&&new Date(r.courtesy).getTime()>now?r.courtesy:null;
  return {id:r.id,name:r.name,email:r.email,createdAt:r.created_at,clients:r.clients??0,admin:admin(r.email),paidUntil:paid>now?new Date(paid).toISOString():null,subscription:r.status,courtesyUntil:courtesy,courtesyForever:courtesy===NO_EXPIRY};});
}
export async function setCourtesy(userId:string,days:number|null,note:string){
 const exists=await env.DB!.prepare('SELECT id FROM users WHERE id=?').bind(userId).first();if(!exists)throw Error('Assinante não encontrado.');
 if(days===0){await env.DB!.prepare('DELETE FROM courtesies WHERE user_id=?').bind(userId).run();return;}
 const until=days===null?NO_EXPIRY:new Date(Date.now()+days*864e5).toISOString();
 await env.DB!.prepare('INSERT INTO courtesies(user_id,until,note,granted_at) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET until=excluded.until,note=excluded.note,granted_at=excluded.granted_at').bind(userId,until,note.slice(0,200)||null,new Date().toISOString()).run();
}
