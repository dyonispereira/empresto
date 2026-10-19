import {getRealUser as getUser} from '../../../auth';
import {admin} from '../../../../lib/billing';
import {setCourtesy} from '../../../../lib/admin';
// days: positive number of days, null for no expiry, 0 to remove the courtesy.
export async function POST(req:Request){const u=await getUser();if(!u||!admin(u.email))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida'},{status:403});try{const {userId,days,note}=await req.json() as {userId:string;days:number|null;note?:string};if(typeof userId!=='string'||!(days===null||(Number.isInteger(days)&&days>=0&&days<=3660)))throw Error('Dados inválidos.');await setCourtesy(userId,days,String(note||''));return Response.json({ok:true})}catch(e){return Response.json({error:(e as Error).message},{status:400})}}
