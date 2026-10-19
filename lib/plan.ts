import {env} from 'cloudflare:workers';
import {access} from './billing';
import {readPortfolio} from './persistence';
import {getTiers,tierFor,capacityFor,getCustomPrice} from './pricing';
// Accounts pay by tier of clients: the app is open with no clients, and each client beyond what the confirmed payment covers needs the next tier paid first.
export const LIMIT_ERROR='Você chegou ao limite de clientes do seu plano. Conclua o pagamento para liberar mais clientes.';
export const countClients=(data:unknown)=>{const clients=(data as {clients?:unknown})?.clients;return Array.isArray(clients)?clients.length:0;};
// `capacity` null means unlimited (administrator, courtesy, or billing switched off).
export const overLimit=(plan:{capacity:number|null},data:unknown)=>plan.capacity!==null&&countClients(data)>plan.capacity;
export async function planAccess(owner:string,email:string){
 const paid=await access(owner,email);
 if(paid.admin||env.REQUIRE_SUBSCRIPTION!=='true')return {...paid,allowed:true,courtesy:false,capacity:null as number|null,clients:null as number|null,price:0};
 const courtesy=await courtesyUntil(owner);
 if(courtesy)return {...paid,allowed:true,until:courtesy,courtesy:true,capacity:null as number|null,clients:null as number|null,price:0};
 const [tiers,row,custom]=await Promise.all([getTiers(),readPortfolio(owner),getCustomPrice(owner)]);
 const clients=row?countClients(JSON.parse(row.data)):0;
 // A special price, once paid, covers any number of clients.
 if(custom){const capacity=paid.allowed&&paid.paidCents>=custom?null:0;return {...paid,allowed:capacity===null||clients<=capacity,courtesy:false,capacity,clients,price:custom};}
 const capacity=paid.allowed?capacityFor(tiers,paid.paidCents):0;
 return {...paid,allowed:clients<=capacity,courtesy:false,capacity:capacity===Infinity?null:capacity,clients,price:tierFor(tiers,clients).price};
}
// Free access granted by the administrator, valid while `until` is in the future.
export const NO_EXPIRY='9999-12-31T23:59:59.000Z';
export async function courtesyUntil(owner:string){const row=await env.DB!.prepare('SELECT until FROM courtesies WHERE user_id=?').bind(owner).first<{until:string}>();return row&&new Date(row.until).getTime()>Date.now()?row.until:null;}
