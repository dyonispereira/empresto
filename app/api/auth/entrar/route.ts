import {signIn,sessionCookie} from '../../../../lib/auth';
import {noStore,sameOrigin,readBody} from '../shared';
import {allow,exhausted,clientIp} from '../../../../lib/rate-limit';
// Only failed attempts count, so many people behind one mobile carrier address are not locked out by each other's logins.
const FAILURES=30,WINDOW=900;
export async function POST(req:Request){if(!sameOrigin(req))return Response.json({error:'Origem inválida'},{status:403});const key='login:'+clientIp(req);try{if(await exhausted(key,FAILURES))return Response.json({error:'Muitas tentativas a partir desta conexão. Aguarde 15 minutos e tente de novo.'},{status:429,headers:noStore});const token=await signIn(await readBody(req));return Response.json({ok:true},{headers:{...noStore,'Set-Cookie':sessionCookie(token)}})}catch(e){await allow(key,FAILURES,WINDOW).catch(()=>null);return Response.json({error:(e as Error).message||'Não foi possível entrar.'},{status:400,headers:noStore})}}
