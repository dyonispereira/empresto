import {getUser} from '../../../auth';
import {admin} from '../../../../lib/billing';
import {runAutoCharges} from '../../../../lib/auto-charge';
// Runs today's automatic WhatsApp charges on demand, the same job the 9h cron runs. Already-sent installments are skipped.
export async function POST(req:Request){const u=await getUser();if(!u||!admin(u.email))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida'},{status:403});try{return Response.json(await runAutoCharges(),{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:(e as Error).message},{status:500})}}
