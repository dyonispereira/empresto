import {signOut,readCookie,clearedCookie} from '../../../../lib/auth';
import {sameOrigin} from '../shared';
export async function POST(req:Request){if(!sameOrigin(req))return new Response('Origem inválida',{status:403});await signOut(readCookie(req.headers.get('cookie')));return new Response(null,{status:303,headers:{Location:'/entrar','Set-Cookie':clearedCookie,'Cache-Control':'no-store'}})}
