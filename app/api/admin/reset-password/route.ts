import {getRealUser} from '../../../auth';
import {admin} from '../../../../lib/billing';
import {userById,resetPassword} from '../../../../lib/auth';
// Passwords are stored only as hashes, so the administrator can issue a temporary one but never read the current one.
export async function POST(req:Request){const u=await getRealUser();if(!u||!admin(u.email))return Response.json({error:'Acesso restrito ao administrador.'},{status:403});if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origem inválida'},{status:403});try{const {userId}=await req.json() as {userId:unknown};if(typeof userId!=='string')throw Error('Dados inválidos.');const target=await userById(userId);if(!target||admin(target.email))throw Error('Assinante não encontrado.');return Response.json({password:await resetPassword(userId)},{headers:{'Cache-Control':'no-store'}})}catch(e){return Response.json({error:(e as Error).message},{status:400})}}
