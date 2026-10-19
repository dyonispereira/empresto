import {getUser} from '../../auth';
import {recordActivity} from '../../../lib/admin';
export async function POST(){const u=await getUser();if(!u)return new Response(null,{status:401});await recordActivity(u.userId);return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})}
