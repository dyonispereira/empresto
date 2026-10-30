import {signUp,sessionCookie} from '../../../../lib/auth';
import {noStore,sameOrigin,readBody} from '../shared';
import {allow,clientIp} from '../../../../lib/rate-limit';
export async function POST(req:Request){if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});try{if(!(await allow('signup:'+clientIp(req),10,3600)))return Response.json({error:'Muitos cadastros a partir desta conexão. Tente de novo mais tarde.'},{status:429,headers:noStore});const token=await signUp(await readBody(req));return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':sessionCookie(token)}})}catch(e){return Response.json({error:(e as Error).message||'Não foi possível criar a conta.'},{status:400,headers:noStore})}}
