import {signOut,readCookie,clearedCookie,clearedInspectCookie} from '../../../../lib/auth';
import {sameOrigin} from '../shared';
export async function POST(req:Request){if(!sameOrigin(req))return new Response('Origem inválida',{status:403});await signOut(readCookie(req.headers.get('cookie')));const headers=new Headers({Location:'/entrar','Cache-Control':'no-store'});headers.append('Set-Cookie',clearedCookie);headers.append('Set-Cookie',clearedInspectCookie);return new Response(null,{status:303,headers})}
