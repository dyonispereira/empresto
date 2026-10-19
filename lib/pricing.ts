import {env} from 'cloudflare:workers';
// Monthly price by number of clients, in cents. `upTo:null` is the last, unlimited tier.
export type Tier={upTo:number|null;price:number};
export const DEFAULT_TIERS:Tier[]=[{upTo:5,price:497},{upTo:10,price:997},{upTo:null,price:2990}];
export function validTiers(t:unknown):t is Tier[]{
 if(!Array.isArray(t)||t.length<1||t.length>6)return false;
 let last=0;
 for(const [i,x] of t.entries()){
  const end=i===t.length-1;
  if(!x||typeof x!=='object'||!Number.isInteger(x.price)||x.price<100||x.price>100000)return false;
  if(end?x.upTo!==null:!(Number.isInteger(x.upTo)&&x.upTo>last))return false;
  if(!end)last=x.upTo;
 }
 return true;
}
export async function getTiers():Promise<Tier[]>{
 const row=await env.DB!.prepare("SELECT value FROM settings WHERE key='tiers'").first<{value:string}>();
 try{const t=row?JSON.parse(row.value):null;if(validTiers(t))return t;}catch{}
 return DEFAULT_TIERS;
}
export async function saveTiers(t:unknown){
 if(!validTiers(t))throw Error('Confira as faixas: limites crescentes, a última sem limite e valores entre R$ 1,00 e R$ 1.000,00.');
 await env.DB!.prepare("INSERT INTO settings(key,value) VALUES('tiers',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(JSON.stringify(t)).run();
}
// The cheapest tier that fits `clients` (at least one client is assumed, so new accounts start on the first tier).
export const tierFor=(tiers:Tier[],clients:number)=>tiers.find(t=>t.upTo===null||Math.max(clients,1)<=t.upTo)!;
// How many clients a paid amount covers: the largest tier whose price it reaches.
export const capacityFor=(tiers:Tier[],paidCents:number)=>{let cap=0;for(const t of tiers)if(paidCents>=t.price)cap=t.upTo??Infinity;return cap;};
export const brlCents=(c:number)=>(c/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export const tierLabel=(tiers:Tier[],t:Tier)=>{const i=tiers.indexOf(t),from=i?tiers[i-1].upTo!+1:1;return t.upTo===null?`Acima de ${from-1} clientes`:from===1?`Até ${t.upTo} clientes`:`De ${from} a ${t.upTo} clientes`;};
