import {signIn,sessionCookie} from '../../../../lib/auth';
import {noStore,sameOrigin,readBody} from '../shared';
export async function POST(req:Request){if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});try{const token=await signIn(await readBody(req));return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':sessionCookie(token)}})}catch(e){return Response.json({error:(e as Error).message||'Não foi possível entrar.'},{status:400,headers:noStore})}}
