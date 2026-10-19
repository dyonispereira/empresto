import {access} from './billing';
import {readPortfolio} from './persistence';
// Free plan: up to FREE_CLIENT_LIMIT clients without a paid subscription.
export const FREE_CLIENT_LIMIT=5;
export const FREE_LIMIT_ERROR=`O plano gratuito permite até ${FREE_CLIENT_LIMIT} clientes. Assine o Emprestô por R$ 29,90/mês para cadastrar mais.`;
export const countClients=(data:unknown)=>{const clients=(data as {clients?:unknown})?.clients;return Array.isArray(clients)?clients.length:0;};
export const overFreeLimit=(plan:{free:boolean},data:unknown)=>plan.free&&countClients(data)>FREE_CLIENT_LIMIT;
export async function planAccess(owner:string,email:string){
 const paid=await access(owner,email);
 if(paid.allowed)return {...paid,free:false,clients:null as number|null,limit:FREE_CLIENT_LIMIT};
 const row=await readPortfolio(owner);const clients=row?countClients(JSON.parse(row.data)):0;
 return {...paid,allowed:clients<=FREE_CLIENT_LIMIT,free:true,clients,limit:FREE_CLIENT_LIMIT};
}
