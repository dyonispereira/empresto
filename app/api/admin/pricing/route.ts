import {getUser} from '../../../auth';
import {admin} from '../../../../lib/billing';
import {getTiers,saveTiers} from '../../../../lib/pricing';
const headers={'Cache-Control':'no-store'};
async function allowed(){const u=await getUser();return !!u&&admin(u.email);}
export async function GET(){if(!(await allowed()))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});return Response.json({tiers:await getTiers()},{headers})}
export async function POST(req:Request){if(!(await allowed()))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida'},{status:403});try{const {tiers}=await req.json() as {tiers:unknown};await saveTiers(tiers);return Response.json({tiers:await getTiers()},{headers})}catch(e){return Response.json({error:(e as Error).message},{status:400,headers})}}
