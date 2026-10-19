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
// Billing periods offered at checkout (Asaas subscription cycles). Only the yearly plan carries a discount.
export const CYCLES={MONTHLY:{months:1,label:'Mensal'},QUARTERLY:{months:3,label:'Trimestral'},SEMIANNUALLY:{months:6,label:'Semestral'},YEARLY:{months:12,label:'Anual'}} as const;
export type Cycle=keyof typeof CYCLES;
export const isCycle=(c:unknown):c is Cycle=>typeof c==='string'&&c in CYCLES;
export const DEFAULT_YEARLY_DISCOUNT=15;
export async function getYearlyDiscount(){
 const row=await env.DB!.prepare("SELECT value FROM settings WHERE key='yearly_discount'").first<{value:string}>();
 const n=row?Number(row.value):DEFAULT_YEARLY_DISCOUNT;return Number.isInteger(n)&&n>=0&&n<=90?n:DEFAULT_YEARLY_DISCOUNT;
}
export async function saveYearlyDiscount(n:unknown){
 if(!(typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<=90))throw Error('O desconto anual deve ser um número inteiro entre 0 e 90.');
 await env.DB!.prepare("INSERT INTO settings(key,value) VALUES('yearly_discount',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").bind(String(n)).run();
}
export const offers=(price:number,yearlyDiscount:number)=>(Object.keys(CYCLES) as Cycle[]).map(cycle=>{const {months,label}=CYCLES[cycle],discount=cycle==='YEARLY'?yearlyDiscount:0;return {cycle,label,months,discount,total:Math.round(price*months*(100-discount)/100)};});
// Special monthly price the administrator sets for one account, in cents; it replaces the tiers and covers any number of clients.
const customKey=(userId:string)=>'price:'+userId;
export async function getCustomPrice(userId:string){const row=await env.DB!.prepare('SELECT value FROM settings WHERE key=?').bind(customKey(userId)).first<{value:string}>();const n=Number(row?.value);return Number.isInteger(n)&&n>0?n:null;}
export async function getCustomPrices(){const {results}=await env.DB!.prepare("SELECT key,value FROM settings WHERE key LIKE 'price:%'").all<{key:string;value:string}>();return new Map(results.map(r=>[r.key.slice(6),Number(r.value)]));}
export async function setCustomPrice(userId:string,cents:number|null){
 if(cents===null){await env.DB!.prepare('DELETE FROM settings WHERE key=?').bind(customKey(userId)).run();return;}
 if(!Number.isInteger(cents)||cents<100||cents>100000)throw Error('Informe um valor entre R$ 1,00 e R$ 1.000,00.');
 await env.DB!.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(customKey(userId),String(cents)).run();
}
