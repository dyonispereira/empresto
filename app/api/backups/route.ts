import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
export async function GET(){const u=await getChatGPTUser();if(!u)return Response.json({error:'Não autorizado'},{status:401});const {results}=await env.DB!.prepare('SELECT id,revision,created_at,action FROM backups WHERE owner=? ORDER BY created_at DESC LIMIT 30').bind(u.userId).all();return Response.json({backups:results},{headers:{'Cache-Control':'no-store'}})}
