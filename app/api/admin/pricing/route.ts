import {getRealUser as getUser} from '../../../auth';
import {admin} from '../../../../lib/billing';
import {getTiers,saveTiers,getYearlyDiscount,saveYearlyDiscount} from '../../../../lib/pricing';
const headers={'Cache-Control':'no-store'};
async function allowed(){const u=await getUser();return !!u&&admin(u.email);}
const current=async()=>({tiers:await getTiers(),yearlyDiscount:await getYearlyDiscount()});
export async function GET(){if(!(await allowed()))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});return Response.json(await current(),{headers})}
export async function POST(req:Request){if(!(await allowed()))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida'},{status:403});try{const {tiers,yearlyDiscount}=await req.json() as {tiers:unknown;yearlyDiscount:unknown};await saveYearlyDiscount(yearlyDiscount);await saveTiers(tiers);return Response.json(await current(),{headers})}catch(e){return Response.json({error:(e as Error).message},{status:400,headers})}}
