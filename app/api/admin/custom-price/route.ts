import {getRealUser as getUser} from '../../../auth';
import {admin} from '../../../../lib/billing';
import {setCustomPrice} from '../../../../lib/pricing';
// price: monthly value in cents, or null to go back to the price by number of clients.
export async function POST(req:Request){const u=await getUser();if(!u||!admin(u.email))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida'},{status:403});try{const {userId,price}=await req.json() as {userId:unknown;price:unknown};if(typeof userId!=='string'||!(price===null||typeof price==='number'))throw Error('Dados inválidos.');await setCustomPrice(userId,price as number|null);return Response.json({ok:true})}catch(e){return Response.json({error:(e as Error).message},{status:400})}}
